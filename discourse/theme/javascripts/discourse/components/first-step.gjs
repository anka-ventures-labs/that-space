import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { service } from "@ember/service";
import Category from "discourse/models/category";
import { settings } from "virtual:theme";
import { openBaMoiChat } from "../lib/ba-moi";
import { safeUsername } from "../lib/safe-values";

const HOME_ROUTES = ["discovery.latest", "discovery.index"];
const INTRO_TITLE = "Xin chào, mình là ";
const INTRO_BODY = [
  "Chào mọi người, mình là …",
  "",
  "Điều đưa mình đến Thật Space: …",
  "",
  "Mình mong tìm thấy ở đây: …",
].join("\n");

// Shown on the home feed until the member has posted anything. It is part of
// the page layout, never a popup, and offers one primary action.
export default class FirstStep extends Component {
  @service appEvents;
  @service composer;
  @service currentUser;
  @service router;

  @tracked postedThisVisit = false;

  constructor() {
    super(...arguments);
    this.appEvents.on("topic:created", this, this.markPosted);
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this.appEvents.off("topic:created", this, this.markPosted);
  }

  // any_posts is only refreshed on page load; keep it true for this session.
  @action
  markPosted() {
    this.postedThisVisit = true;
    this.currentUser?.set("any_posts", true);
  }

  // any_posts is core's own current-user flag (count fields are staff-only).
  get shouldRender() {
    return (
      Boolean(this.currentUser) &&
      !this.currentUser.any_posts &&
      !this.postedThisVisit &&
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
      this.baMoiUsername && this.currentUser?.can_direct_message
    );
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
      openBaMoiChat(this.baMoiUsername);
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
