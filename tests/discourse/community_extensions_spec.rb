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

    presentation.theme.update_setting("gallery_path", "/wrong-gallery")
    expect(presentation.check!.drift).to include("Thật Space setting gallery_path")
    expect(presentation.theme.get_setting("gallery_path")).to eq("/wrong-gallery")
    presentation.apply!
    expect(presentation.theme.get_setting("gallery_path")).to eq(configured_category("exhibition").url)
  end

  it "refuses to take over an unrelated same-named theme" do
    existing_id = presentation.theme.id
    PluginStore.remove(ThatSpace::PresentationBootstrap::STORE, "theme")
    count = Theme.count
    expect { presentation.apply! }.to raise_error(ThatSpace::PresentationBootstrap::Error, /refusing takeover/)
    expect(Theme.count).to eq(count)
    expect(Theme.find_by(name: "Thật Space").id).to eq(existing_id)
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
