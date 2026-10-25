import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { service } from "@ember/service";
import bodyClass from "discourse/helpers/body-class";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { settings } from "virtual:theme";
import { isBaMoiThread } from "../lib/ba-moi";
import { safeUsername } from "../lib/safe-values";

// Turns the member's Bà Mối thread into a chat: the page gets a body class
// (bubbles, no forum chrome) and a single pinned message box. Sending posts a
// normal reply, so the Bà Mối service and Discourse AI are unchanged.
export default class BaMoiChat extends Component {
  @service currentUser;

  @tracked text = "";
  @tracked sending = false;

  get topic() {
    return this.args.outletArgs?.model;
  }

  get active() {
    return (
      Boolean(this.currentUser) &&
      isBaMoiThread(this.topic, safeUsername(settings.ba_moi_username))
    );
  }

  get cannotSend() {
    return this.sending || this.text.trim().length === 0;
  }

  @action
  updateText(event) {
    this.text = event.target.value;
  }

  @action
  handleKey(event) {
    // Enter sends, Shift+Enter adds a line; never send mid-IME composition.
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.send();
    }
  }

  @action
  async send(event) {
    event?.preventDefault();
    if (this.cannotSend) {
      return;
    }
    this.sending = true;
    try {
      await ajax("/posts.json", {
        type: "POST",
        data: { topic_id: this.topic.id, raw: this.text.trim() },
      });
      this.text = "";
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.sending = false;
    }
  }

  <template>
    {{#if this.active}}
      {{bodyClass "ba-moi-chat"}}
      <form class="ba-moi-chat-input" {{on "submit" this.send}}>
        <label class="sr-only" for="ba-moi-chat-text">Nhắn cho Bà Mối</label>
        <textarea
          id="ba-moi-chat-text"
          rows="1"
          placeholder="Nhắn cho Bà Mối…"
          value={{this.text}}
          disabled={{this.sending}}
          {{on "input" this.updateText}}
          {{on "keydown" this.handleKey}}
        ></textarea>
        <button
          class="btn btn-primary ba-moi-chat-input__send"
          type="submit"
          disabled={{this.cannotSend}}
        >
          Gửi
        </button>
      </form>
    {{/if}}
  </template>
}
