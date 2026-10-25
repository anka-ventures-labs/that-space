# frozen_string_literal: true

require_relative "spec_helper"

module ThatSpaceModerationSpecSupport
  REPO_ROOT = Pathname.new(ENV.fetch("THAT_SPACE_REPO"))
  MANIFEST_PATH = REPO_ROOT.join("discourse/moderation/manifest.json").freeze
  BOOTSTRAP_PATH = REPO_ROOT.join("discourse/moderation/bootstrap.rb").freeze

  raise "That Space moderation manifest is missing: #{MANIFEST_PATH}" unless MANIFEST_PATH.file?
  raise "That Space moderation bootstrap is missing: #{BOOTSTRAP_PATH}" unless BOOTSTRAP_PATH.file?

  require BOOTSTRAP_PATH.to_s

  def that_space_moderation_manifest
    @that_space_moderation_manifest ||= JSON.parse(File.read(MANIFEST_PATH))
  end

  def that_space_moderation_bootstrap(llm_model_id:)
    ThatSpace::ModerationBootstrap.new(
      manifest_path: MANIFEST_PATH.to_s,
      llm_model_id: llm_model_id,
    )
  end
end

RSpec.configure do |config|
  config.include ThatSpaceModerationSpecSupport
end

describe ThatSpace::ModerationBootstrap do
  fab!(:llm_model)

  before do
    SiteSetting.discourse_ai_enabled = true
    PluginStore.remove("that-space-community-moderation", "ownership")
    AiModerationSetting.spam&.destroy!
    SiteSetting.ai_spam_detection_enabled = false
  end

  def apply_moderation!
    that_space_moderation_bootstrap(llm_model_id: llm_model.id).apply!
  end

  def configured_triage_automation
    DiscourseAutomation::Automation.find_by!(name: that_space_moderation_manifest.dig("triage", "name"))
  end

  it "reports setup drift without mutating records in check mode" do
    bootstrap = that_space_moderation_bootstrap(llm_model_id: llm_model.id)

    expect { @checked = bootstrap.check! }.not_to change { [AiAgent.count, DiscourseAutomation::Automation.count, AiModerationSetting.count] }

    aggregate_failures do
      expect(@checked.drift).to include("native spam setting is missing")
      expect(PluginStore.get("that-space-community-moderation", "ownership")).to be_nil
      expect(SiteSetting.ai_spam_detection_enabled).to eq(false)
    end
  end

  it "requires an existing model and refuses to take over a same-named agent" do
    expect do
      that_space_moderation_bootstrap(llm_model_id: -99).check!
    end.to raise_error(ThatSpace::ModerationBootstrap::Error, /does not exist/)

    AiAgent.create!(
      name: that_space_moderation_manifest.dig("triage", "agent_name"),
      description: "Existing unowned agent",
      system_prompt: "Unowned agent",
    )

    expect { apply_moderation! }.to raise_error(ThatSpace::ModerationBootstrap::ConflictError, /not owned/)
    expect(PluginStore.get("that-space-community-moderation", "ownership")).to be_nil
  end

  it "installs an idempotent review-only classifier with native spam scanning disabled" do
    first = apply_moderation!
    second = apply_moderation!
    agent = AiAgent.find_by!(name: that_space_moderation_manifest.dig("triage", "agent_name"))
    automation = configured_triage_automation

    aggregate_failures do
      expect(first.changes).not_to be_empty
      expect(second.changes).to be_empty
      expect(AiModerationSetting.spam.llm_model_id).to eq(llm_model.id)
      expect(SiteSetting.ai_spam_detection_enabled).to eq(false)
      expect(agent.default_llm_id).to eq(llm_model.id)
      expect(agent.tools).to eq([])
      expect(agent.vision_enabled).to eq(false)
      expect(agent.allow_personal_messages).to eq(false)
      expect(automation.script).to eq("llm_triage")
      expect(automation.trigger).to eq("post_created_edited")
      expect(automation.trigger_field("restricted_archetype").fetch("value")).to eq("regular")
      expect(automation.script_field("include_personal_messages").fetch("value")).to eq(false)
      expect(automation.script_field("flag_post").fetch("value")).to eq(true)
      expect(automation.script_field("flag_type").fetch("value")).to eq("review")
      expect(automation.script_field("hide_topic")).to eq({})
      expect(automation.script_field("canned_reply")).to eq({})
      expect(automation.script_field("reply_agent")).to eq({})
    end
  end

  it "queues a marker match for human review without hiding, replying, or sanctioning" do
    apply_moderation!
    automation = configured_triage_automation
    post = Fabricate(:post, raw: "Nhấp vào link này để nhận tiền ngay")
    initial_post_count = post.topic.posts.count

    DiscourseAi::Completions::Llm.with_prepared_responses(["THAT_SPACE_HUMAN_REVIEW"]) do
      automation.running_in_background!
      automation.trigger!("post" => post)
    end

    reviewable = ReviewablePost.find_by!(target: post)
    aggregate_failures do
      expect(reviewable.reviewable_by_moderator).to eq(true)
      expect(post.reload.hidden?).to eq(false)
      expect(post.topic.reload.visible).to eq(true)
      expect(post.topic.posts.count).to eq(initial_post_count)
      expect(post.user.reload.silenced?).to eq(false)
    end
  end

  it "leaves a safe marker unflagged and excludes PMs and the Bà Mối bot from classification" do
    apply_moderation!
    automation = configured_triage_automation
    safe_post = Fabricate(:post, raw: "Mình muốn tìm một workshop vẽ cuối tuần để bình tĩnh hơn.")
    pm_post = Fabricate(:post, topic: Fabricate(:private_message_topic), raw: "Tin nhắn riêng cần được loại trừ")
    ba_moi = Fabricate(:bot, username: "ba-moi-review-bot")
    ba_moi_post = Fabricate(:post, user: ba_moi, raw: "Bài viết của Bà Mối phải được bỏ qua")

    DiscourseAi::Completions::Llm.with_prepared_responses(
      ["THAT_SPACE_SAFE", "THAT_SPACE_HUMAN_REVIEW"],
    ) do |response|
      automation.running_in_background!
      automation.trigger!("post" => safe_post)
      automation.trigger!("post" => pm_post)
      automation.trigger!("post" => ba_moi_post)
      expect(response.completions).to eq(1)
    end

    expect(Reviewable.where(target: [safe_post, pm_post, ba_moi_post])).to be_empty
  end
end
