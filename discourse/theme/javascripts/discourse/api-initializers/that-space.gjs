import { apiInitializer } from "discourse/lib/api";
import { settings } from "virtual:theme";
import FirstStep from "../components/first-step";
import { openBaMoiChat } from "../lib/ba-moi";
import { safeUsername } from "../lib/safe-values";

export default apiInitializer((api) => {
  // Staff keep operational notices; members get a quieter page.
  const currentUser = api.getCurrentUser();
  if (currentUser && !currentUser.staff) {
    document.documentElement.classList.add("that-space-member");
  }

  // The first-step card is the only onboarding guidance: no tips or popups.
  api.renderInOutlet("discovery-list-container-top", FirstStep);

  // Bà Mối sits in the sidebar beside the other destinations. The rest of the
  // links are owned server-side by discourse/presentation/bootstrap.rb. A
  // click opens the member's one direct chat with her.
  const baMoi = safeUsername(settings.ba_moi_username);
  if (!baMoi) {
    return;
  }

  api.addCommunitySectionLink((BaseCommunitySectionLink) => {
    return class BaMoiSectionLink extends BaseCommunitySectionLink {
      get name() {
        return "ba-moi";
      }

      get href() {
        return "/chat";
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
        return Boolean(this.currentUser?.can_direct_message);
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
      openBaMoiChat(baMoi);
    },
    true
  );
});
