import Component from "@glimmer/component";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { settings } from "virtual:theme";

const DEFAULT_GALLERY_PATH = "/c/trien-lam";
const DEFAULT_EVENTS_PATH = "/upcoming-events";
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,59}$/i;

function safeMemberPath(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  const path = value.trim();
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    return fallback;
  }

  try {
    const url = new URL(path, "https://that-space.invalid");
    return url.origin === "https://that-space.invalid"
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}

function safeUsername(value) {
  const username = typeof value === "string" ? value.trim() : "";
  return USERNAME_PATTERN.test(username) ? username : null;
}

export default class MemberNavigation extends Component {
  @service composer;
  @service currentUser;

  get isMember() {
    return Boolean(this.currentUser);
  }

  get galleryPath() {
    return safeMemberPath(settings.gallery_path, DEFAULT_GALLERY_PATH);
  }

  get eventsPath() {
    return safeMemberPath(settings.events_path, DEFAULT_EVENTS_PATH);
  }

  get profilePath() {
    const username = this.currentUser?.username;
    return username ? `/u/${encodeURIComponent(username)}` : "/";
  }

  get logoUrl() {
    return settings.theme_uploads["that-space-logo"];
  }

  get baMoiUsername() {
    return safeUsername(settings.ba_moi_username);
  }

  get canMessageBaMoi() {
    return Boolean(this.baMoiUsername && this.currentUser?.can_send_private_messages);
  }

  @action
  openBaMoiComposer() {
    if (!this.canMessageBaMoi) {
      return;
    }

    this.composer.openNewMessage({ recipients: this.baMoiUsername });
  }

  <template>
    {{#if this.isMember}}
      <nav class="that-space-member-nav" aria-label="Điều hướng thành viên">
        <a class="that-space-member-nav__brand" href="/" aria-label="Thật Space — Diễn đàn">
          <img src={{this.logoUrl}} alt="Thật Space" />
          <span>Thật Space</span>
        </a>

        <div class="that-space-member-nav__links">
          <a href="/">Diễn đàn</a>
          <a href={{this.galleryPath}}>Triển lãm</a>
          <a href={{this.eventsPath}}>Retreat &amp; Workshop</a>
          <a href={{this.profilePath}}>Hồ sơ của tôi</a>
        </div>

        {{#if this.canMessageBaMoi}}
          <button
            class="that-space-member-nav__ba-moi"
            type="button"
            {{on "click" this.openBaMoiComposer}}
          >
            Nhắn Bà Mối
          </button>
        {{/if}}
      </nav>
    {{/if}}
  </template>
}

export { safeMemberPath, safeUsername };
