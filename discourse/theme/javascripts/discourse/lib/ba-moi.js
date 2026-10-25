import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import DiscourseURL from "discourse/lib/url";

const OPENING_MESSAGE = "Chào Bà Mối 🌸";
const THREAD_WAIT_MS = 15000;
const THREAD_POLL_MS = 1500;

let opening = false;

// Discourse AI answers a member's top-level message in a direct chat inside a
// thread on that message, and only remembers that thread. So the member's
// conversation with Bà Mối is her latest thread there, and we always open it.
export async function latestBaMoiThreadId(channelId) {
  const result = await ajax(`/chat/api/channels/${channelId}/messages.json`, {
    data: { page_size: 20, direction: "past" },
  });
  const withThread = (result.messages || [])
    .filter((message) => message.thread_id)
    .sort((a, b) => b.id - a.id);
  return withThread[0]?.thread_id || null;
}

function channelPath(channel) {
  return `/chat/c/${channel.slug || "-"}/${channel.id}`;
}

async function waitForThread(channelId) {
  const deadline = Date.now() + THREAD_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, THREAD_POLL_MS));
    const threadId = await latestBaMoiThreadId(channelId);
    if (threadId) {
      return threadId;
    }
  }
  return null;
}

// Opens the member's one conversation with Bà Mối. The first time, it sends
// her greeting for her, shows the chat, then moves into the thread as soon as
// Bà Mối starts answering (that answer creates the thread).
export async function openBaMoiChat(botUsername) {
  if (opening || !botUsername) {
    return;
  }
  opening = true;
  try {
    const { channel } = await ajax("/chat/api/direct-message-channels.json", {
      type: "POST",
      data: { target_usernames: [botUsername], upsert: true },
    });
    let threadId = await latestBaMoiThreadId(channel.id);
    if (!threadId) {
      await ajax(`/chat/${channel.id}.json`, {
        type: "POST",
        data: { message: OPENING_MESSAGE },
      });
      DiscourseURL.routeTo(channelPath(channel));
      threadId = await waitForThread(channel.id);
      if (!threadId) {
        return;
      }
    }
    DiscourseURL.routeTo(`${channelPath(channel)}/t/${threadId}`);
  } catch (error) {
    popupAjaxError(error);
  } finally {
    opening = false;
  }
}

// A member who lands on the top level of her Bà Mối chat (for example from
// chat's own list) is moved into the current thread, so a new message there
// does not start a conversation Bà Mối cannot remember.
export async function redirectToBaMoiThread(channelId, botUsername) {
  try {
    const { channel } = await ajax(`/chat/api/channels/${channelId}.json`);
    // Depending on the serializer the member herself may or may not be listed;
    // a Bà Mối chat is a direct chat whose only other person is the bot.
    const bot = botUsername.toLowerCase();
    const users = channel?.chatable?.users || [];
    const isBaMoi =
      channel?.chatable_type === "DirectMessage" &&
      users.length <= 2 &&
      users.some((user) => user.username?.toLowerCase() === bot);
    if (!isBaMoi) {
      return;
    }
    const threadId = await latestBaMoiThreadId(channel.id);
    if (threadId) {
      DiscourseURL.routeTo(`${channelPath(channel)}/t/${threadId}`, {
        replaceURL: true,
      });
    }
  } catch {
    // Leave the member where she is; the chat itself still works.
  }
}
