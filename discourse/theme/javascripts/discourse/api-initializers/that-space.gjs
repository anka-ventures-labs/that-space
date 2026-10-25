import { apiInitializer } from "discourse/lib/api";
import { settings } from "virtual:theme";
import FirstStep from "../components/first-step";
import { BA_MOI_MESSAGE_TITLE, safeUsername } from "../lib/safe-values";

export default apiInitializer((api) => {
  // Staff keep operational notices; members get a quieter page.
  const currentUser = api.getCurrentUser();
  if (currentUser && !currentUser.staff) {
    document.documentElement.classList.add("that-space-member");
  }

  // The first-step card is the only onboarding guidance: no tips or popups.
  api.renderInOutlet("discovery-list-container-top", FirstStep);

  // Bà Mối sits in the sidebar beside the other destinations. The rest of the
  // links are owned server-side by discourse/presentation/bootstrap.rb.
  const baMoi = safeUsername(settings.ba_moi_username);
  if (baMoi) {
    api.addCommunitySectionLink((BaseCommunitySectionLink) => {
      return class BaMoiSectionLink extends BaseCommunitySectionLink {
        get name() {
          return "ba-moi";
        }

        get route() {
          return "new-message";
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

        get query() {
          return { username: baMoi, title: BA_MOI_MESSAGE_TITLE };
        }

        get shouldDisplay() {
          return Boolean(this.currentUser?.can_send_private_messages);
        }
      };
    });
  }
});
