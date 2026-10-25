# frozen_string_literal: true

require_relative "spec_helper"
require ThatSpaceCommunitySpecSupport::REPO_ROOT.join("discourse/presentation/bootstrap.rb").to_s

RSpec.describe "Thật Space community extensions", type: :request do
  let(:presentation) { ThatSpace::PresentationBootstrap.new(repo_path: ThatSpaceCommunitySpecSupport::REPO_ROOT) }
  let!(:member) { Fabricate(:user, refresh_auto_groups: true) }
  let!(:other_member) { Fabricate(:user, refresh_auto_groups: true) }

  before do
    Jobs.run_immediately!
    apply_that_space_community!
    presentation.apply!
    SiteSetting.fast_typing_threshold = "disabled"
  end

  it "imports pinned components once and detects drift without changing it" do
    ids = Theme.order(:id).pluck(:id)
    expect(presentation.apply!.changes).to be_empty
    expect(Theme.order(:id).pluck(:id)).to eq(ids)
    expect(presentation.check!.drift).to be_empty

    introduction_id = configured_category("introduction").id
    presentation.theme.update_setting("introduction_category_id", 0)
    expect(presentation.check!.drift).to include("Thật Space Brand setting introduction_category_id")
    expect(presentation.theme.get_setting("introduction_category_id")).to eq(0)
    presentation.apply!
    expect(presentation.theme.get_setting("introduction_category_id")).to eq(introduction_id)
  end

  it "serves members core Horizon with the brand palette and components attached" do
    horizon = Theme.horizon_theme
    expect(SiteSetting.default_theme_id).to eq(horizon.id)
    expect(presentation.theme).to be_component
    expect(horizon.child_theme_ids).to include(presentation.theme.id)
    expect(horizon.color_scheme.name).to eq(ThatSpace::PresentationBootstrap::PALETTE_NAME)
    expect(horizon.dark_color_scheme_id).to be_nil
    expect(horizon.color_scheme.colors.find { |color| color.name == "tertiary" }.hex.downcase).to eq("7a4e36")

    horizon.update!(dark_color_scheme_id: ColorScheme.where.not(id: horizon.color_scheme_id).first.id)
    expect(presentation.check!.drift).to include("Horizon palette")
    presentation.apply!
    expect(horizon.reload.dark_color_scheme_id).to be_nil
  end

  it "replaces the busy default sidebar with the member destinations and quiets onboarding" do
    section = SidebarSection.find_by!(section_type: "community")
    links = section.sidebar_urls.order("sidebar_section_links.position").pluck(:name, :value)
    expect(links).to eq(
      [
        ["Bảng tin", "/latest"],
        ["Sự kiện", "/upcoming-events"],
        ["Triển lãm", configured_category("exhibition").url],
        ["Hộp thư", "/my/messages"],
        ["Kiểm duyệt", "/review"],
        ["Quản trị", "/admin"],
        ["Về Thật Space", "/about"],
        ["Nội quy", "/faq"],
      ],
    )
    expect(SiteSetting.top_menu).to eq("latest")
    expect(SiteSetting.chat_enabled).to eq(true)
    expect(SiteSetting.enable_public_channels).to eq(false)
    expect(SiteSetting.chat_max_direct_message_users).to eq(1)
    expect(SiteSetting.chat_allow_uploads).to eq(true)
    expect(SiteSetting.chat_search_enabled).to eq(false)
    expect(SiteSetting.discourse_narrative_bot_enabled).to eq(false)
    expect(SiteSetting.enable_welcome_banner(theme_id: Theme.horizon_theme.id)).to eq(false)
    expect(SiteSetting.tagging_enabled).to eq(false)
    ThatSpace::PresentationBootstrap::VI_LABELS.each do |key, value|
      expect(TranslationOverride.find_by!(locale: "vi", translation_key: key).value).to eq(value)
    end

    section.sidebar_urls.first.update!(name: "Topics")
    expect(presentation.check!.drift).to include("community sidebar links")
    presentation.apply!
    expect(section.reload.sidebar_urls.order("sidebar_section_links.position").first.name).to eq("Bảng tin")
  end

  it "checks a site still on the legacy theme without writing, then cuts over and keeps the rollback theme" do
    legacy = Theme.create!(name: "Thật Space", user_id: Discourse.system_user.id)
    PluginStore.set(ThatSpace::PresentationBootstrap::STORE, ThatSpace::PresentationBootstrap::LEGACY_THEME_KEY, { "id" => legacy.id })
    SiteSetting.default_theme_id = legacy.id
    SiteSetting.top_menu = "latest|hot|categories"

    drift = presentation.check!.drift
    expect(drift).to include("default member theme", "site setting top_menu")
    expect(SiteSetting.default_theme_id).to eq(legacy.id)
    expect(SiteSetting.top_menu).to eq("latest|hot|categories")

    presentation.apply!
    expect(SiteSetting.default_theme_id).to eq(Theme.horizon_theme.id)
    expect(presentation.legacy_theme).to eq(legacy)
    expect(presentation.check!.drift).to be_empty
  end

  it "lets a real Discourse AI bot user open a member's direct chat and post into it with its own key" do
    agent = AiAgent.create!(name: "Bà Mối acceptance", description: "Bà Mối", system_prompt: "Bà Mối", allow_chat_direct_messages: true)
    bot = agent.create_user!
    Group.refresh_automatic_groups!
    expect(bot.id).to be < 0
    key = ApiKey.create!(user_id: bot.id, created_by_id: Discourse.system_user.id)
    headers = { "Api-Key" => key.key, "Api-Username" => bot.username }

    post "/chat/api/direct-message-channels.json", params: { target_usernames: [member.username], upsert: true }, headers: headers, as: :json
    expect(response.status).to eq(200), response.body
    channel_id = response.parsed_body.dig("channel", "id")
    expect(Chat::Channel.find(channel_id).chatable.users).to contain_exactly(member, bot)

    post "/chat/#{channel_id}.json", params: { message: "Bà có tin vui cho bạn" }, headers: headers, as: :json
    expect(response.status).to eq(200), response.body
    expect(Chat::Message.find(response.parsed_body["message_id"])).to have_attributes(user_id: bot.id, chat_channel_id: channel_id)

    post "/chat/api/direct-message-channels.json", params: { target_usernames: [member.username], upsert: true }, headers: headers, as: :json
    expect(response.parsed_body.dig("channel", "id")).to eq(channel_id)

    # A member who turned chat off is refused, so the service falls back to her private thread.
    other_member.user_option.update!(chat_enabled: false)
    post "/chat/api/direct-message-channels.json", params: { target_usernames: [other_member.username], upsert: true }, headers: headers, as: :json
    expect(response.status).to be_between(400, 499)
  end

  it "refuses an admin-customised sidebar before changing anything" do
    section = SidebarSection.find_by!(section_type: "community")
    custom = SidebarUrl.create!(name: "Admin pick", value: "/c/thong-bao", icon: "star", segment: "primary", external: false)
    SidebarSectionLink.create!(user_id: Discourse.system_user.id, linkable: custom, sidebar_section: section, position: 99)
    PluginStore.remove(ThatSpace::PresentationBootstrap::STORE, ThatSpace::PresentationBootstrap::SIDEBAR_KEY)
    SiteSetting.top_menu = "latest|new"

    expect { presentation.apply! }.to raise_error(ThatSpace::PresentationBootstrap::Error, /refusing takeover/)
    expect(SiteSetting.top_menu).to eq("latest|new")
    expect(section.reload.sidebar_urls).to include(custom)
  end

  it "refuses to take over an unrelated same-named theme" do
    existing_id = presentation.theme.id
    PluginStore.remove(ThatSpace::PresentationBootstrap::STORE, ThatSpace::PresentationBootstrap::BRAND_KEY)
    count = Theme.count
    expect { presentation.apply! }.to raise_error(ThatSpace::PresentationBootstrap::Error, /refusing takeover/)
    expect(Theme.count).to eq(count)
    expect(Theme.find_by(name: "Thật Space Brand").id).to eq(existing_id)
  end

  it "allows an approved member to update her bio and feature her own artwork topic" do
    artwork = create_post(user: member, category: configured_category("exhibition"), title: "An artist's first exhibition", raw: "A member-owned artwork with its story and process.")
    sign_in(member)
    put "/u/#{member.username}.json", params: { bio_raw: "Mình yêu nghệ thuật và những kết nối tử tế." }
    expect(response.status).to eq(200)
    expect(member.user_profile.reload.bio_raw).to include("Mình yêu nghệ thuật")
    put "/u/#{member.username}/feature-topic.json", params: { topic_id: artwork.topic_id }
    expect(response.status).to eq(200)
    expect(member.user_profile.reload.featured_topic_id).to eq(artwork.topic_id)

    get "/topics/created-by/#{member.username}.json", params: { category: configured_category("exhibition").id }
    expect(response.status).to eq(200)
    expect(response.parsed_body.dig("topic_list", "topics").map { |topic| topic["id"] }).to include(artwork.topic_id)

    delete "/session/#{member.username}.json", xhr: true
    expect(response.status).to eq(200)
    expect(session[:current_user_id]).to be_nil
    get "/t/#{artwork.topic_id}.json"
    expect(response.status).to eq(403)
    expect(response.body).not_to include(artwork.raw)
  end

  it "follows a member, receives a topic notification, and respects their opt-out" do
    sign_in(member)
    put "/follow/#{other_member.username}.json"
    expect(response.status).to eq(200)
    expect(member.reload.following).to include(other_member)
    expect {
      create_post(user: other_member, category: configured_category("art-creation"), title: "A followed artist shares a story", raw: "A new post from the artist whom this member follows.")
    }.to change { member.notifications.where(notification_type: Notification.types[:following_created_topic]).count }.by(1)

    delete "/follow/#{other_member.username}.json"
    expect(response.status).to eq(200)
    other_member.custom_fields["allow_people_to_follow_me"] = false
    other_member.save_custom_fields
    put "/follow/#{other_member.username}.json"
    expect(response.status).to eq(403)
    expect(member.reload.following).not_to include(other_member)
  end

  it "serves uploaded artwork to members while denying anonymous downloads" do
    sign_in(member)
    image = Rack::Test::UploadedFile.new(file_from_fixtures("smallest.png", "images"))
    post "/uploads.json", params: { file: image, upload_type: "composer" }
    expect(response.status).to eq(200)
    upload = Upload.get_from_url(response.parsed_body.fetch("url"))
    expect(upload.user_id).to eq(member.id)
    get upload.short_path
    expect(response.status).to eq(200)
    delete "/session/#{member.username}.json"
    expect(response.status).to eq(302)
    expect(session[:current_user_id]).to be_nil
    expect(response.cookies["_t"]).to be_blank
    get upload.short_path
    expect(response.status).to eq(404)
  end

  it "lets a new member ignore another member and later restore contact" do
    sign_in(member)
    put "/u/#{other_member.username}/notification_level.json", params: { notification_level: "ignore", expiring_at: 30.days.from_now.iso8601 }
    expect(response.status).to eq(200)
    expect(IgnoredUser.exists?(user_id: member.id, ignored_user_id: other_member.id)).to eq(true)
    put "/u/#{other_member.username}/notification_level.json", params: { notification_level: "normal" }
    expect(response.status).to eq(200)
    expect(IgnoredUser.exists?(user_id: member.id, ignored_user_id: other_member.id)).to eq(false)
  end

  it "lets a Host create a retreat and a member RSVP without granting staff access" do
    host = Fabricate(:user, refresh_auto_groups: true)
    configured_group("role.host").add(host)
    expect(host.reload).not_to be_staff
    expect(Guardian.new(host).can_create_discourse_post_event?).to eq(true)
    expect(Guardian.new(member).can_create_discourse_post_event?).to eq(false)

    sign_in(host)
    start = 2.days.from_now.utc.strftime("%Y-%m-%d %H:%M")
    post "/posts.json", params: {
      category: configured_category("retreat-workshop").id,
      title: "Retreat for creating and connecting",
      raw: "Một buổi gặp gỡ cùng nghệ thuật.\n\n[event start=\"#{start}\" status=\"public\"]\n[/event]"
    }
    expect(response.status).to eq(200)
    event = DiscourseEvents::Events::Event.find(response.parsed_body.fetch("id"))
    sign_in(member)
    post "/discourse-post-event/events/#{event.id}/invitees.json", params: { invitee: { status: "going" } }
    expect(response.status).to eq(200)
    expect(event.invitees.find_by!(user_id: member.id).status).to eq(DiscourseEvents::Events::Invitee.statuses[:going])
    get "/discourse-post-event/events/#{event.id}.json"
    expect(response.status).to eq(200)
    delete "/session/#{member.username}.json"
    expect(response.status).to eq(302)
    expect(session[:current_user_id]).to be_nil
    expect(response.cookies["_t"]).to be_blank
    get "/discourse-post-event/events/#{event.id}.json"
    expect(response.status).not_to eq(200)
  end
end
