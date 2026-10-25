import { apiInitializer } from "discourse/lib/api";
import { settings } from "virtual:theme";
import BaMoiChat from "../components/ba-moi-chat";
import FirstStep from "../components/first-step";
import { openBaMoi } from "../lib/ba-moi";
import { safeUsername } from "../lib/safe-values";

export default apiInitializer((api) => {
  // Staff keep operational notices; members get a quieter page.
  const currentUser = api.getCurrentUser();
  if (currentUser && !currentUser.staff) {
    document.documentElement.classList.add("that-space-member");
  }

  // The first-step card is the only onboarding guidance: no tips or popups.
  api.renderInOutlet("discovery-list-container-top", FirstStep);

  const baMoi = safeUsername(settings.ba_moi_username);
  if (!baMoi) {
    return;
  }

  // Bà Mối's thread reads as a chat: bubbles plus one pinned message box.
  api.renderInOutlet("topic-area-bottom", BaMoiChat);
  api.addPostClassesCallback((attrs) =>
    attrs.username?.toLowerCase() === baMoi.toLowerCase() ? ["ba-moi-post"] : []
  );

  // Bà Mối sits in the sidebar beside the other destinations. The rest of the
  // links are owned server-side by discourse/presentation/bootstrap.rb. A
  // click opens (or starts) the member's single conversation with her.
  api.addCommunitySectionLink((BaseCommunitySectionLink) => {
    return class BaMoiSectionLink extends BaseCommunitySectionLink {
      get name() {
        return "ba-moi";
      }

      get href() {
        return "/my/messages";
      }

      get text() {
        return "Bà Mối";
      }

      get title() {
        return "Trò chuyện riêng với Bà Mối";
      }

      get prefixValue() {
        return "heart";
      }

      get shouldDisplay() {
        return Boolean(this.currentUser?.can_send_private_messages);
      }
    };
  });

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest?.('a[data-link-name="ba-moi"]');
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      openBaMoi(api.getCurrentUser(), baMoi);
    },
    true
  );
});
