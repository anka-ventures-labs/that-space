import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import DiscourseURL from "discourse/lib/url";

let opening = false;

// Bà Mối lives in native Discourse Chat: one direct chat per member, which
// Discourse creates on first use and returns on every later call (upsert).
export async function openBaMoiChat(botUsername) {
  if (opening || !botUsername) {
    return;
  }
  opening = true;
  try {
    const result = await ajax("/chat/api/direct-message-channels.json", {
      type: "POST",
      data: { target_usernames: [botUsername], upsert: true },
    });
    const channel = result.channel;
    DiscourseURL.routeTo(`/chat/c/${channel.slug || "-"}/${channel.id}`);
  } catch (error) {
    popupAjaxError(error);
  } finally {
    opening = false;
  }
}
