# frozen_string_literal: true

require_relative "spec_helper"

RSpec.describe "Thật Space member acceptance", type: :request do
  around do |example|
    # Core skips this production callback for its fabricated-user test suites.
    # Self-service activation must exercise actual automatic membership.
    User.set_callback(:create, :after, :ensure_in_trust_level_group)
    example.run
  ensure
    User.skip_callback(:create, :after, :ensure_in_trust_level_group)
  end

  before do
    Jobs.run_immediately!
    apply_that_space_community!
    SiteSetting.fast_typing_threshold = "disabled"
    SiteSetting.auto_approve_email_domains = ""
    SiteSetting.flag_post_allowed_groups = [Group[:admins].id, Group[:moderators].id, Group[:trust_level_0].id].join("|")
    UsersController.any_instance.stubs(:honeypot_value).returns(nil)
    UsersController.any_instance.stubs(:challenge_value).returns(nil)
  end

  def stage_verified_google_signup
    SiteSetting.google_oauth2_client_id = "acceptance-client"
    SiteSetting.google_oauth2_client_secret = "acceptance-secret"
    SiteSetting.enable_google_oauth2_logins = true

    # `session` resolves through the current request, which does not exist until
    # a call has been made. Prime it the same way Discourse's own server_session
    # helper does before touching `session`.
    get "/session/hp.json"

    authentication = Auth::Result.new
    authentication.email = "google-member@example.com"
    authentication.username = "google_member"
    authentication.name = "Google Member"
    authentication.email_valid = true
    authentication.authenticator_name = "google_oauth2"
    authentication.extra_data = { provider: "google_oauth2", uid: "acceptance-google-uid" }.with_indifferent_access
    session[:authentication] = authentication.session_data
  end

  # Google is the only admission path, so a completed OAuth handoff is what
  # creates the account. No password is set and no activation email is sent.
  def create_google_member
    stage_verified_google_signup
    post "/u.json",
         params: {
           email: "google-member@example.com",
           username: "google_member",
           name: "Google Member",
           user_fields: that_space_signup_fields,
         }

    expect(response.status).to eq(200)
    expect(response.parsed_body).to include("success" => true, "active" => true)

    member = User.find_by_email!("google-member@example.com")
    expect(member).to be_active
    expect(member).to be_email_confirmed
    expect(session[:current_user_id]).to eq(member.id)
    expect(configured_group("role.user").reload.users).to include(member)

    member
  end

  it "refuses a password signup outright rather than creating an account that could never activate" do
    post "/u.json",
         params: {
           email: "acceptance-member@example.com",
           username: "acceptance_member",
           name: "Acceptance Member",
           password: "a sufficiently strong acceptance password",
           user_fields: that_space_signup_fields,
         }

    expect(response.status).to eq(403)
    expect(User.find_by_email("acceptance-member@example.com")).to be_nil
  end

  it "refuses password login so no unverified identity can reach member content" do
    member = create_google_member

    delete "/session/#{member.username}.json", xhr: true
    expect(response.status).to eq(200)
    expect(session[:current_user_id]).to be_nil
    post "/session.json", params: { login: member.email, password: "a sufficiently strong acceptance password" }

    expect(response.status).not_to eq(200)
    expect(session[:current_user_id]).to be_nil
  end

  it "requires every onboarding answer after a verified Google handoff before creating and linking the account" do
    stage_verified_google_signup

    post "/u.json",
         params: {
           email: "google-member@example.com",
           username: "google_member",
           name: "Google Member",
           user_fields: that_space_signup_fields.except(that_space_signup_fields.keys.first),
         }

    expect(response.status).to eq(200)
    expect(response.parsed_body).to include("success" => false)
    expect(User.find_by_email("google-member@example.com")).to be_nil

    post "/u.json",
         params: {
           email: "google-member@example.com",
           username: "google_member",
           name: "Google Member",
           user_fields: that_space_signup_fields,
         }

    member = User.find_by_email!("google-member@example.com")
    expect(response.status).to eq(200)
    expect(response.parsed_body).to include("success" => true, "active" => true)
    expect(member).to be_active
    expect(member).to be_email_confirmed
    expect(session[:current_user_id]).to eq(member.id)
    expect(member.user_associated_accounts.find_by!(provider_name: "google_oauth2").provider_uid).to eq(
      "acceptance-google-uid",
    )
    expect(configured_group("role.user").reload.users).to include(member)
  end

  it "creates a topic and reply through HTTP after a Google signup, then queues a real moderation review" do
    member = create_google_member

    category = configured_category("introduction")
    expect(member.reload.in_any_groups?([Group[:trust_level_0].id])).to eq(true), member.group_users.pluck(:group_id).inspect
    expect(Guardian.new(member).can_create_topic_on_category?(category)).to eq(true), {
      silenced: member.silenced?,
      create_groups: SiteSetting.create_topic_allowed_groups,
      approve_groups: SiteSetting.approve_unless_allowed_groups,
    }.inspect
    post "/posts.json",
         params: {
           category: category.id,
           title: "A real acceptance topic",
           raw: "A real acceptance post written by a synthetic member.",
         }

    expect(response.status).to eq(200), response.body
    first_post = Post.find(response.parsed_body.fetch("id"))
    expect(first_post.topic.category).to eq(category)

    delete "/session/#{member.username}.json", xhr: true
    expect(response.status).to eq(200)
    expect(session[:current_user_id]).to be_nil
    replier = Fabricate(:user, refresh_auto_groups: true)
    sign_in(replier)
    expect {
      post "/posts.json",
           params: {
             topic_id: first_post.topic_id,
             reply_to_post_number: first_post.post_number,
             raw: "A synthetic reply that should notify the original member.",
           }
    }.to change {
      member.notifications.where(
        topic_id: first_post.topic_id,
        notification_type: Notification.types[:replied],
      ).count
    }.by(1)
    expect(response.status).to eq(200)

    post "/post_actions.json",
         params: {
           id: first_post.id,
           post_action_type_id: PostActionType.types.fetch(:inappropriate),
           message: "Synthetic acceptance flag for moderator review.",
         }

    expect(response.status).to eq(200)
    reviewable = ReviewableFlaggedPost.find_by!(target: first_post)
    expect(reviewable).to be_pending

    delete "/session/#{replier.username}.json", xhr: true
    expect(response.status).to eq(200)
    expect(session[:current_user_id]).to be_nil
    moderator = Fabricate(:moderator, refresh_auto_groups: true)
    sign_in(moderator)
    get "/review.json", params: { ids: [reviewable.id] }

    expect(response.status).to eq(200)
    expect(response.parsed_body.fetch("reviewables").map { |item| item.fetch("id") }).to include(
      reviewable.id,
    )
    put "/review/#{reviewable.id}/perform/disagree.json", params: { version: reviewable.reload.version }
    expect(response.status).to eq(200)
    expect(reviewable.reload).to be_rejected
    expect(first_post.reload).not_to be_hidden
  end

  it "rejects anonymous posting and review-queue access through HTTP" do
    category = configured_category("introduction")

    post "/posts.json", params: { category: category.id, title: "Guest topic", raw: "Guest body" }
    expect(response.status).to eq(403)

    get "/review.json"
    expect(response.status).to eq(403)
  end

  it "keeps onboarding answers out of another member's profile response" do
    member = create_google_member
    private_field = configured_user_field("relationship_status")
    other_member = Fabricate(:user, refresh_auto_groups: true)

    delete "/session/#{member.username}.json", xhr: true
    expect(response.status).to eq(200)
    expect(session[:current_user_id]).to be_nil
    sign_in(other_member)
    get "/u/#{member.username}.json"

    expect(response.status).to eq(200)
    expect(response.parsed_body.fetch("user").fetch("user_fields", {})).not_to have_key(
      private_field.id.to_s,
    )

    delete "/session/#{other_member.username}.json", xhr: true
    expect(response.status).to eq(200)
    expect(session[:current_user_id]).to be_nil
    sign_in(member)
    get "/u/#{member.username}.json"

    expect(response.status).to eq(200)
    expect(response.parsed_body.fetch("user").fetch("user_fields")).to include(
      private_field.id.to_s => that_space_signup_fields.fetch(private_field.id.to_s),
    )
  end
end
