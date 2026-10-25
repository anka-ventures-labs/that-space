import { apiInitializer } from "discourse/lib/api";
import MemberNavigation from "../components/member-navigation";
import MemberWelcome from "../components/member-welcome";

export default apiInitializer((api) => {
  api.renderInOutlet("below-site-header", MemberNavigation);
  api.renderInOutlet("discovery-list-container-top", MemberWelcome);
});
