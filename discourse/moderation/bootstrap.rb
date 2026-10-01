# frozen_string_literal: true

# Rails-native, review-only moderation setup for the pinned Discourse AI and
# Automation plugins. Requiring this file is safe. Invoke explicitly with:
#   THAT_SPACE_MODERATION_BOOTSTRAP=1 THAT_SPACE_MODERATION_LLM_MODEL_ID=42 \
#     rails runner /shared/that-space/discourse/moderation/bootstrap.rb -- --check
require "json"

module ThatSpace
  class ModerationBootstrap
    MANIFEST_ID = "that-space-community-moderation"
    PLUGIN_STORE_NAME = "that-space-community-moderation"
    PLUGIN_STORE_KEY = "ownership"
    MANIFEST_PATH_ENV = "THAT_SPACE_MODERATION_MANIFEST"
    LLM_MODEL_ID_ENV = "THAT_SPACE_MODERATION_LLM_MODEL_ID"

    Result = Struct.new(:changes, :drift, :warnings, keyword_init: true)

    class Error < StandardError; end
    class ConflictError < Error; end
    class DriftError < Error; end

    attr_reader :manifest_path, :llm_model_id

    def initialize(manifest_path: default_manifest_path, llm_model_id: ENV[LLM_MODEL_ID_ENV])
      @manifest_path = manifest_path.to_s
      @manifest = JSON.parse(File.read(@manifest_path))
      @llm_model_id = Integer(llm_model_id)
      @changes = []
      @drift = []
      @warnings = []
      validate_manifest!
    rescue JSON::ParserError => error
      raise Error, "Invalid moderation manifest #{@manifest_path}: #{error.message}"
    rescue ArgumentError, TypeError
      raise Error, "Set #{LLM_MODEL_ID_ENV} to the ID of an existing, preconfigured Discourse AI LlmModel"
    end

    def apply!
      reconcile(apply: true)
      result
    end

    def check!
      reconcile(apply: false)
      result
    end

    def check_or_raise!
      checked = check!
      raise DriftError, checked.drift.join("\n") if checked.drift.any?

      checked
    end

    def self.default_manifest_path
      File.expand_path("manifest.json", __dir__)
    end

    def self.run_cli!
      check = ARGV.delete("--check")
      bootstrap = new(manifest_path: ENV.fetch(MANIFEST_PATH_ENV, default_manifest_path))
      checked = check ? bootstrap.check! : bootstrap.apply!
      checked.changes.each { |change| puts "CHANGED: #{change}" }
      checked.warnings.each { |warning| puts "WARNING: #{warning}" }
      checked.drift.each { |drift| puts "DRIFT: #{drift}" }
      exit(1) if check && checked.drift.any?
    end

    private

    def default_manifest_path
      self.class.default_manifest_path
    end

    def result
      Result.new(changes: @changes.dup, drift: @drift.dup, warnings: @warnings.dup)
    end

    def reconcile(apply:)
      ensure_dependencies!
      model = find_safe_model!

      if apply
        ActiveRecord::Base.transaction do
          reconcile_owned_records(model, apply: true)
        end
      else
        reconcile_owned_records(model, apply: false)
      end
    end

    def validate_manifest!
      raise Error, "Unsupported moderation manifest schema" unless @manifest["schema_version"] == 1
      raise Error, "Unexpected moderation manifest id" unless @manifest["manifest_id"] == MANIFEST_ID

      triage = @manifest.fetch("triage")
      %w[name agent_name script trigger review_marker safe_marker prompt_path].each do |key|
        raise Error, "Moderation manifest triage.#{key} is required" if triage[key].to_s.empty?
      end
      raise Error, "Review and safe markers must differ" if triage["review_marker"] == triage["safe_marker"]
      raise Error, "Moderation must keep native spam disabled" if @manifest.dig("native_spam", "enabled") != false
      raise Error, "Moderation max_post_tokens must be positive" unless triage["max_post_tokens"].to_i.positive?
      raise Error, "Moderation prompt is missing: #{prompt_path}" unless File.file?(prompt_path)
    end

    def ensure_dependencies!
      required = {
        "Discourse AI" => %i[AiAgent LlmModel AiModerationSetting],
        "Discourse Automation" => %i[DiscourseAutomation],
      }
      missing = required.flat_map { |name, constants| constants.reject { |constant| Object.const_defined?(constant) }.map { "#{name} (#{constant})" } }
      raise Error, "Required plugin models are unavailable: #{missing.join(", ")}" if missing.any?

      script = DiscourseAutomation::Scriptable.new(@manifest.dig("triage", "script"))
      raise Error, "Discourse AI llm_triage script is unavailable on this build" if script.not_found

      trigger = DiscourseAutomation::Triggerable.new(@manifest.dig("triage", "trigger"))
      raise Error, "Discourse Automation post_created_edited trigger is unavailable on this build" if trigger.not_found
    end

    def find_safe_model!
      model = LlmModel.find_by(id: llm_model_id)
      raise Error, "LlmModel #{llm_model_id} does not exist; configure a model in Discourse AI, then set #{LLM_MODEL_ID_ENV}" unless model

      if model.allowed_attachment_types.present?
        raise Error, "LlmModel #{llm_model_id} allows document attachments. Select a preconfigured model with no allowed attachment types so triage receives only title and post text"
      end

      model
    end

    def reconcile_owned_records(model, apply:)
      ownership = PluginStore.get(PLUGIN_STORE_NAME, PLUGIN_STORE_KEY)
      ownership = ownership.to_h.stringify_keys if ownership
      spam_setting = reconcile_spam_setting(model, ownership, apply: apply)
      agent = reconcile_triage_agent(model, ownership, apply: apply)
      automation = reconcile_triage_automation(agent, ownership, apply: apply)
      reconcile_native_spam_disabled(ownership, apply: apply)
      %w[discourse_ai_enabled discourse_automation_enabled].each do |setting|
        difference("site setting #{setting} must be enabled", apply: apply) do
          SiteSetting.set(setting, true)
        end unless SiteSetting.public_send(setting)
      end

      return unless apply

      PluginStore.set(
        PLUGIN_STORE_NAME,
        PLUGIN_STORE_KEY,
        {
          "manifest_id" => MANIFEST_ID,
          "revision" => @manifest.fetch("revision"),
          "spam_setting_id" => spam_setting.id,
          "agent_id" => agent.id,
          "automation_id" => automation.id,
        },
      )
    end

    def reconcile_spam_setting(model, ownership, apply:)
      expected_id = ownership&.fetch("spam_setting_id", nil)&.to_i
      setting = AiModerationSetting.spam
      if setting && expected_id.nil?
        conflict!("native spam setting exists but is not owned by #{MANIFEST_ID}", apply: apply)
        return setting
      end
      if expected_id && (!setting || setting.id != expected_id)
        conflict!("owned native spam setting #{expected_id} is missing or replaced", apply: apply)
        return setting
      end

      unless setting
        difference("native spam setting is missing", apply: apply) do
          setting = AiModerationSetting.create!(
            setting_type: :spam,
            llm_model_id: model.id,
            ai_agent_id: spam_detector_agent_id,
            data: { "custom_instructions" => @manifest.dig("native_spam", "custom_instructions") },
          )
        end
        return setting
      end

      expected = spam_setting_attributes(model)
      mismatches = expected.filter_map { |attribute, value| attribute.to_s if setting.public_send(attribute) != value }
      if mismatches.any?
        difference("native spam setting differs in #{mismatches.join(", ")}", apply: apply) do
          setting.update!(expected)
        end
      end
      setting
    end

    def spam_setting_attributes(model)
      {
        llm_model_id: model.id,
        ai_agent_id: spam_detector_agent_id,
        data: { "custom_instructions" => @manifest.dig("native_spam", "custom_instructions") },
      }
    end

    def spam_detector_agent_id
      DiscourseAi::Agents::Agent.system_agents.fetch(DiscourseAi::Agents::SpamDetector)
    rescue NameError, KeyError
      raise Error, "Discourse AI SpamDetector system agent is unavailable on this build"
    end

    def reconcile_triage_agent(model, ownership, apply:)
      name = @manifest.dig("triage", "agent_name")
      expected_id = ownership&.fetch("agent_id", nil)&.to_i
      agent = AiAgent.find_by(name: name)
      if agent && expected_id.nil?
        conflict!("triage agent #{name.inspect} exists but is not owned by #{MANIFEST_ID}", apply: apply)
        return agent
      end
      if expected_id && (!agent || agent.id != expected_id)
        conflict!("owned triage agent #{expected_id} is missing or replaced", apply: apply)
        return agent
      end

      expected = triage_agent_attributes(model)
      unless agent
        difference("triage agent #{name.inspect} is missing", apply: apply) do
          agent = AiAgent.create!(expected.merge(name: name))
        end
        return agent
      end

      unsafe = []
      unsafe << "tools" if agent.tools.present?
      unsafe << "vision_enabled" if agent.vision_enabled
      unsafe << "user_id" if agent.user_id.present?
      unsafe << "allow_personal_messages" if agent.allow_personal_messages
      unsafe << "allow_topic_mentions" if agent.allow_topic_mentions
      unsafe << "allow_chat_channel_mentions" if agent.allow_chat_channel_mentions
      unsafe << "allow_chat_direct_messages" if agent.allow_chat_direct_messages
      conflict!("owned triage agent has unsafe #{unsafe.join(", ")}", apply: apply) if unsafe.any?

      mismatches = expected.filter_map { |attribute, value| attribute.to_s if agent.public_send(attribute) != value }
      if mismatches.any?
        difference("triage agent differs in #{mismatches.join(", ")}", apply: apply) do
          agent.update!(expected)
        end
      end
      agent
    end

    def triage_agent_attributes(model)
      {
        description: "Classifies public Thật Space posts for human moderation review.",
        system_prompt: File.read(prompt_path),
        default_llm_id: model.id,
        force_default_llm: true,
        enabled: true,
        tools: [],
        vision_enabled: false,
        user_id: nil,
        allowed_group_ids: [],
        allow_personal_messages: false,
        allow_topic_mentions: false,
        allow_chat_channel_mentions: false,
        allow_chat_direct_messages: false,
        show_thinking: false,
        temperature: 0,
      }
    end

    def reconcile_triage_automation(agent, ownership, apply:)
      name = @manifest.dig("triage", "name")
      expected_id = ownership&.fetch("automation_id", nil)&.to_i
      automation = DiscourseAutomation::Automation.find_by(name: name)
      if automation && expected_id.nil?
        conflict!("triage automation #{name.inspect} exists but is not owned by #{MANIFEST_ID}", apply: apply)
        return automation
      end
      if expected_id && (!automation || automation.id != expected_id)
        conflict!("owned triage automation #{expected_id} is missing or replaced", apply: apply)
        return automation
      end

      unless automation
        difference("triage automation #{name.inspect} is missing", apply: apply) do
          automation = DiscourseAutomation::Automation.create!(
            name: name,
            script: @manifest.dig("triage", "script"),
            trigger: @manifest.dig("triage", "trigger"),
            last_updated_by_id: Discourse.system_user.id,
            enabled: false,
          )
          expected_automation_fields(agent).each do |field|
            automation.upsert_field!(field.fetch(:name), field.fetch(:component), field.fetch(:metadata), target: field.fetch(:target))
          end
          automation.perform_required_fields_validation = true
          automation.update!(enabled: true)
        end
        return automation
      end

      expected_attributes = {
        script: @manifest.dig("triage", "script"),
        trigger: @manifest.dig("triage", "trigger"),
      }
      mismatches = expected_attributes.filter_map { |attribute, value| attribute.to_s if automation.public_send(attribute) != value }
      if mismatches.any?
        difference("triage automation differs in #{mismatches.join(", ")}", apply: apply) do
          automation.update!(expected_attributes.merge(enabled: false))
        end
      end

      reconcile_automation_fields(automation, agent, apply: apply)
      reject_unsafe_automation_actions!(automation, apply: apply)
      if !automation.enabled
        difference("triage automation is disabled", apply: apply) do
          automation.perform_required_fields_validation = true
          automation.update!(enabled: true)
        end
      end
      automation
    end

    def expected_automation_fields(agent)
      triage = @manifest.fetch("triage")
      [
        { name: "restricted_archetype", component: "choices", metadata: { "value" => "regular" }, target: "trigger" },
        { name: "triage_agent", component: "choices", metadata: { "value" => agent.id }, target: "script" },
        { name: "search_for_text", component: "text", metadata: { "value" => triage.fetch("review_marker") }, target: "script" },
        { name: "max_post_tokens", component: "text", metadata: { "value" => triage.fetch("max_post_tokens") }, target: "script" },
        { name: "include_personal_messages", component: "boolean", metadata: { "value" => false }, target: "script" },
        { name: "flag_post", component: "boolean", metadata: { "value" => true }, target: "script" },
        { name: "flag_type", component: "choices", metadata: { "value" => "review" }, target: "script" },
      ]
    end

    def reconcile_automation_fields(automation, agent, apply:)
      expected_automation_fields(agent).each do |expected|
        field = automation.fields.find_by(name: expected.fetch(:name), target: expected.fetch(:target))
        if field && (field.component != expected.fetch(:component) || field.metadata != expected.fetch(:metadata))
          difference("triage automation field #{expected.fetch(:name)} differs", apply: apply) do
            field.update!(component: expected.fetch(:component), metadata: expected.fetch(:metadata))
          end
        elsif !field
          difference("triage automation field #{expected.fetch(:name)} is missing", apply: apply) do
            automation.upsert_field!(expected.fetch(:name), expected.fetch(:component), expected.fetch(:metadata), target: expected.fetch(:target))
          end
        end
      end
    end

    def reject_unsafe_automation_actions!(automation, apply:)
      unsafe_fields = {
        "category" => ->(value) { value.present? },
        "tags" => ->(value) { value.present? },
        "hide_topic" => ->(value) { value == true },
        "canned_reply" => ->(value) { value.present? },
        "canned_reply_user" => ->(value) { value.present? },
        "reply_agent" => ->(value) { value.present? },
        "whisper" => ->(value) { value == true },
        "notify_author_pm" => ->(value) { value == true },
        "notify_author_pm_user" => ->(value) { value.present? },
        "notify_author_pm_message" => ->(value) { value.present? },
      }
      found = unsafe_fields.filter_map do |name, unsafe|
        value = automation.script_field(name)["value"]
        name if unsafe.call(value)
      end
      conflict!("owned triage automation has unsafe actions: #{found.join(", ")}", apply: apply) if found.any?
    end

    def reconcile_native_spam_disabled(ownership, apply:)
      return unless SiteSetting.ai_spam_detection_enabled

      if ownership
        difference("native spam scanner must remain disabled for human-review-only moderation", apply: apply) do
          SiteSetting.set(:ai_spam_detection_enabled, false)
        end
      else
        conflict!("native spam scanner is already enabled and can auto-hide or silence users; disable it before installing review-only moderation", apply: apply)
      end
    end

    def prompt_path
      File.expand_path(@manifest.dig("triage", "prompt_path"), File.dirname(manifest_path))
    end

    def difference(message, apply:)
      if apply
        yield
        @changes << message
      else
        @drift << message
      end
    end

    def conflict!(message, apply:)
      raise ConflictError, message if apply

      @drift << message
    end
  end
end

ThatSpace::ModerationBootstrap.run_cli! if ENV["THAT_SPACE_MODERATION_BOOTSTRAP"] == "1"
