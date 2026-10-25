import Component from "@glimmer/component";
import { on } from "@ember/modifier";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { settings } from "virtual:theme";
import { safeMemberPath, safeUsername } from "./member-navigation";

const DEFAULT_GALLERY_PATH = "/c/trien-lam";
const DEFAULT_EVENTS_PATH = "/upcoming-events";

export default class MemberWelcome extends Component {
  @service composer;
  @service currentUser;

  get shouldRender() {
    return Boolean(this.currentUser && settings.show_member_welcome);
  }

  get galleryPath() {
    return safeMemberPath(settings.gallery_path, DEFAULT_GALLERY_PATH);
  }

  get eventsPath() {
    return safeMemberPath(settings.events_path, DEFAULT_EVENTS_PATH);
  }

  get baMoiUsername() {
    return safeUsername(settings.ba_moi_username);
  }

  get canMessageBaMoi() {
    return Boolean(this.baMoiUsername && this.currentUser?.can_send_private_messages);
  }

  @action
  openBaMoiComposer() {
    if (this.canMessageBaMoi) {
      this.composer.openNewMessage({ recipients: this.baMoiUsername });
    }
  }

  <template>
    {{#if this.shouldRender}}
      <section class="that-space-member-welcome" aria-labelledby="that-space-welcome-title">
        <div class="that-space-member-welcome__copy">
          <p class="that-space-member-welcome__eyebrow">Không gian của chúng mình</p>
          <h1 id="that-space-welcome-title">Chậm lại, kết nối và cùng tạo nên điều đẹp đẽ.</h1>
          <p>
            Chia sẻ điều đang nuôi dưỡng bạn, khám phá tác phẩm của nhau và gặp gỡ trong những trải nghiệm ngoài đời.
          </p>
        </div>

        <div class="that-space-member-welcome__actions">
          <a href="/">Vào diễn đàn</a>
          <a href={{this.galleryPath}}>Xem Triển lãm</a>
          <a href={{this.eventsPath}}>Xem lịch gặp gỡ</a>
          {{#if this.canMessageBaMoi}}
            <button type="button" {{on "click" this.openBaMoiComposer}}>Trò chuyện cùng Bà Mối</button>
          {{/if}}
        </div>
      </section>
    {{/if}}
  </template>
}
