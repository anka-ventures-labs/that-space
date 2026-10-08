# frozen_string_literal: true

require_relative "spec_helper"

RSpec.describe "Thật Space member acceptance", type: :request do
  let!(:admin) { Fabricate(:admin) }

  around do |example|
    # Core skips this production callback for its fabricated-user test suites.
    # Invite acceptance must exercise actual automatic membership at creation.
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
  end

  def create_pending_invited_member
    invite = Fabricate(:invite, invited_by: admin, email: "acceptance-member@example.com")
    login_code = EmailLoginCode.generate!(email: invite.email)

    post "/session/login-code/verify.json",
         params: {
           invite_key: invite.invite_key,
           code: login_code.code,
           username: "acceptance_member",
           name: "Acceptance Member",
         }

    expect(response.status).to eq(200)
    expect(response.parsed_body.fetch("user_fields_required")).to eq(true)
    expect(User.find_by_email(invite.email)).to be_nil
    expect(invite.reload).not_to be_redeemed
    expect(login_code.reload.consumed_at).to be_nil

    post "/session/login-code/verify.json",
         params: {
           invite_key: invite.invite_key,
           code: login_code.code,
           username: "acceptance_member",
           name: "Acceptance Member",
           user_fields: that_space_signup_fields,
         }

    member = User.find_by_email(invite.email)
    expect(member).to be_present
    expect(response.status).to eq(200)
    expect(response.parsed_body).to eq("pending_approval" => true)
    expect(member).to be_active
    expect(member).not_to be_approved
    expect(member).not_to be_moderator
    that_space_signup_fields.each do |field_id, submitted_answer|
      expect(Array(member.user_fields.fetch(field_id))).to eq(Array(submitted_answer))
    end
    adult_field = configured_user_field("adult_attestation")
    expect(member.user_fields.fetch(adult_field.id.to_s)).to eq("Tôi xác nhận")
    expect(invite.reload).to be_redeemed
    expect(login_code.reload.consumed_at).to be_present
    expect(session[:current_user_id]).to be_nil

    member
  end

  def approve_and_log_in(member)
    sign_in(admin)
    put "/admin/users/#{member.id}/approve.json"
    expect(response.status).to eq(200)
    expect(member.reload).to be_approved
    expect(member).not_to be_moderator

    delete "/session/#{admin.username}.json", xhr: true
    expect(response.status).to eq(200)
    expect(session[:current_user_id]).to be_nil
    login_code = EmailLoginCode.generate!(email: member.email)
    post "/session/login-code/verify.json", params: { email: member.email, code: login_code.code }

    expect(response.status).to eq(200)
    expect(response.parsed_body.dig("user", "id")).to eq(member.id)
    expect(session[:current_user_id]).to eq(member.id)
    expect(configured_group("role.user").reload.users).to include(member)
  end

  it "requires an invitation, the 18+ attestation, and every onboarding field before creating a pending member" do
    create_pending_invited_member
  end

  it "keeps a pending invitee out through the native login-code endpoint" do
    member = create_pending_invited_member
    login_code = EmailLoginCode.generate!(email: member.email)

    post "/session/login-code/verify.json", params: { email: member.email, code: login_code.code }

    expect(response.status).to eq(200)
    expect(response.parsed_body).to eq("pending_approval" => true)
    expect(session[:current_user_id]).to be_nil
  end

  it "creates a topic and reply through HTTP after native approval, then queues a real moderation review" do
    member = create_pending_invited_member
    approve_and_log_in(member)

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
    member = create_pending_invited_member
    approve_and_log_in(member)
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
