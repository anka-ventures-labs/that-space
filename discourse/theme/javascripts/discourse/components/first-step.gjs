import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import Category from "discourse/models/category";
import { settings } from "virtual:theme";
import { BA_MOI_MESSAGE_TITLE, safeUsername } from "../lib/safe-values";

const HOME_ROUTES = ["discovery.latest", "discovery.index"];
const INTRODUCED_KEY_PREFIX = "that-space-introduced:";
const INTRO_TITLE = "Xin chào, mình là ";
const INTRO_BODY = [
  "Chào mọi người, mình là …",
  "",
  "Điều đưa mình đến Thật Space: …",
  "",
  "Mình mong tìm thấy ở đây: …",
].join("\n");

// Shown on the home feed until the member writes their first post. It is part
// of the page layout, never a popup, and offers one primary action.
export default class FirstStep extends Component {
  @service composer;
  @service currentUser;
  @service router;

  @tracked hasPosted = this.#rememberedIntroduced();

  // Per account, so a shared browser never hides another member's first step.
  get #introducedKey() {
    return `${INTRODUCED_KEY_PREFIX}${this.currentUser?.id}`;
  }

  constructor() {
    super(...arguments);
    if (this.currentUser && !this.hasPosted) {
      this.#loadPostCount();
    }
  }

  get shouldRender() {
    return (
      Boolean(this.currentUser) &&
      this.hasPosted === false &&
      HOME_ROUTES.includes(this.router.currentRouteName) &&
      !this.args.outletArgs?.category
    );
  }

  get introductionCategory() {
    const id = parseInt(settings.introduction_category_id, 10);
    return id > 0 ? Category.findById(id) : null;
  }

  get baMoiUsername() {
    return safeUsername(settings.ba_moi_username);
  }

  get canMessageBaMoi() {
    return Boolean(
      this.baMoiUsername && this.currentUser?.can_send_private_messages
    );
  }

  #rememberedIntroduced() {
    try {
      if (!this.currentUser) {
        return null;
      }
      return window.localStorage.getItem(this.#introducedKey) === "1"
        ? true
        : null;
    } catch {
      return null;
    }
  }

  async #loadPostCount() {
    try {
      const result = await ajax(
        `/u/${encodeURIComponent(this.currentUser.username)}.json`
      );
      const posted = (result?.user?.post_count ?? 0) > 0;
      if (posted) {
        try {
          window.localStorage.setItem(this.#introducedKey, "1");
        } catch {
          // Storage can be unavailable in private browsing; the check repeats.
        }
      }
      if (!this.isDestroying && !this.isDestroyed) {
        this.hasPosted = posted;
      }
    } catch {
      // If the count is unknown, show the plain feed rather than a wrong prompt.
    }
  }

  @action
  writeIntroduction() {
    this.composer.openNewTopic({
      category: this.introductionCategory,
      title: INTRO_TITLE,
      body: INTRO_BODY,
    });
  }

  @action
  messageBaMoi() {
    if (this.canMessageBaMoi) {
      this.composer.openNewMessage({
        recipients: this.baMoiUsername,
        title: BA_MOI_MESSAGE_TITLE,
      });
    }
  }

  <template>
    {{#if this.shouldRender}}
      <section
        class="that-space-first-step"
        aria-labelledby="that-space-first-step-title"
      >
        <p class="that-space-first-step__eyebrow">Bước đầu tiên</p>
        <h2 id="that-space-first-step-title">
          Chào bạn! Hãy để mọi người biết bạn là ai.
        </h2>
        <p class="that-space-first-step__copy">
          Vài dòng ngắn là đủ: bạn là ai, điều gì đưa bạn đến Thật Space. Cả
          cộng đồng sẽ chào đón bạn.
        </p>
        <button
          class="btn btn-primary that-space-first-step__action"
          type="button"
          {{on "click" this.writeIntroduction}}
        >
          Viết lời giới thiệu
        </button>
        {{#if this.canMessageBaMoi}}
          <p class="that-space-first-step__aside">
            Bạn đến để tìm người hợp duyên?
            <button
              class="btn-link that-space-first-step__ba-moi"
              type="button"
              {{on "click" this.messageBaMoi}}
            >
              Trò chuyện riêng với Bà Mối
            </button>
          </p>
        {{/if}}
      </section>
    {{/if}}
  </template>
}
