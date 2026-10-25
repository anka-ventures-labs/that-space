import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import DiscourseURL from "discourse/lib/url";
import { BA_MOI_MESSAGE_TITLE } from "./safe-values";

const OPENING_MESSAGE = "Chào Bà Mối 🌸";

// A member's conversation with Bà Mối is one private message thread between
// exactly the two of them (the service remembers it the same way). Match
// relay threads are with the relay bot, so they are never picked here.
export async function findBaMoiThread(username, botUsername) {
  const data = await ajax(
    `/topics/private-messages/${encodeURIComponent(username)}.json`
  );
  const bot = botUsername.toLowerCase();
  const names = new Map(
    (data.users || []).map((user) => [user.id, user.username.toLowerCase()])
  );
  return (
    (data.topic_list?.topics || []).find(
      (topic) =>
        topic.allowed_user_count === 2 &&
        [...(topic.participants || []), ...(topic.posters || [])].some(
          (person) => names.get(person.user_id) === bot
        )
    ) || null
  );
}

let opening = false;

// Opens the member's existing thread, or starts it with a short greeting so
// they land straight in the conversation (Bà Mối answers the greeting).
export async function openBaMoi(currentUser, botUsername) {
  if (opening || !currentUser || !botUsername) {
    return;
  }
  opening = true;
  try {
    const thread = await findBaMoiThread(currentUser.username, botUsername);
    if (thread) {
      DiscourseURL.routeTo(`/t/${thread.slug}/${thread.id}/last`);
      return;
    }
    const created = await ajax("/posts.json", {
      type: "POST",
      data: {
        title: BA_MOI_MESSAGE_TITLE,
        raw: OPENING_MESSAGE,
        target_recipients: botUsername,
        archetype: "private_message",
      },
    });
    DiscourseURL.routeTo(`/t/${created.topic_slug}/${created.topic_id}`);
  } catch (error) {
    popupAjaxError(error);
  } finally {
    opening = false;
  }
}

export function isBaMoiThread(topic, botUsername) {
  if (!topic?.isPrivateMessage || !botUsername) {
    return false;
  }
  const allowed = topic.details?.allowed_users || [];
  return (
    allowed.length === 2 &&
    allowed.some(
      (user) => user.username?.toLowerCase() === botUsername.toLowerCase()
    )
  );
}
