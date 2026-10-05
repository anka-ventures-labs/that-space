# frozen_string_literal: true

# A small, deliberately Rails-native reconciler for the configuration owned by
# discourse/community/manifest.json. It uses Discourse models rather than
# unversioned admin API guesses, so the same code can be exercised in a pinned
# Discourse test container and run with `rails runner` in production.
#
# Requiring this file is safe. For the explicit runner entry point use:
#   THAT_SPACE_COMMUNITY_BOOTSTRAP=1 rails runner /shared/that-space/discourse/community/bootstrap.rb -- --check
# Omit --check to apply.
require "json"

module ThatSpace
  class CommunityBootstrap
    MANIFEST_ID = "that-space-community"
    MANIFEST_TYPE = "that-space-community"
    OWNER_FIELD_PREFIX = "that_space.community"
    MANIFEST_PATH_ENV = "THAT_SPACE_COMMUNITY_MANIFEST"

    Result = Struct.new(:changes, :drift, :warnings, keyword_init: true)

    class Error < StandardError; end
    class ConflictError < Error; end
    class DriftError < Error; end

    attr_reader :manifest_path

    def initialize(manifest_path: default_manifest_path)
      @manifest_path = manifest_path.to_s
      @manifest = JSON.parse(File.read(@manifest_path))
      @changes = []
      @drift = []
      @warnings = []
      validate_manifest!
    rescue JSON::ParserError => error
      raise Error, "Invalid community manifest #{@manifest_path}: #{error.message}"
    end

    # Reconciles only records marked as owned by this manifest. A same-named
    # existing record without that marker is a conflict, never an implicit
    # takeover. The method is idempotent: a second apply returns no changes.
    def apply!
      reconcile(apply: true)
      result
    end

    # Reads the complete owned surface and records every mismatch without
    # mutating it. This is suitable for acceptance tests and release checks.
    def check!
      reconcile(apply: false)
      result
    end

    def check_or_raise!
      checked = check!
      raise DriftError, checked.drift.join("\n") if checked.drift.any?

      checked
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

    def self.default_manifest_path
      File.expand_path("manifest.json", __dir__)
    end

    private

    def default_manifest_path
      self.class.default_manifest_path
    end

    def result
      Result.new(changes: @changes.dup, drift: @drift.dup, warnings: @warnings.dup)
    end

    def reconcile(apply:)
      ensure_automation_available!
      reconcile_site_settings(apply: apply)
      groups = reconcile_groups(apply: apply)
      fields = reconcile_user_fields(apply: apply)
      reconcile_categories(apply: apply)
      reconcile_role_automation(fields.fetch(@manifest.dig("automation", "field_key")), groups, apply: apply)
    end

    def validate_manifest!
      admission_contract = {
        "login_required" => true,
        "allow_new_registrations" => true,
        "enable_signup_cta" => true,
        "invite_only" => false,
        "invite_code" => "",
        "must_approve_users" => false,
        "enable_local_logins" => false,
        "auth_skip_create_confirm" => false,
        "enable_smtp" => false,
        "disable_emails" => "yes"
      }
      unless admission_contract.all? { |setting, expected| @manifest.fetch("site_settings").fetch(setting) == expected }
        raise Error, "The community requires Google-only self-service signup with login-gated member content"
      end
      raise Error, "Unsupported community manifest schema" unless @manifest["schema_version"] == 1
      raise Error, "Unexpected community manifest id" unless @manifest["manifest_id"] == MANIFEST_ID

      validate_unique!(@manifest.fetch("categories"), "key", "category")
      validate_unique!(@manifest.fetch("groups"), "key", "group")
      validate_unique!(@manifest.fetch("groups"), "name", "group name")
      validate_unique!(@manifest.fetch("user_fields"), "key", "user field")
      validate_unique!(@manifest.fetch("user_fields"), "question", "user field question")

      categories = @manifest.fetch("categories").to_h { |category| [category.fetch("key"), category] }
      categories.each_value do |category|
        parent = category["parent"]
        raise Error, "Unknown parent #{parent} for category #{category.fetch("key")}" if parent && !categories.key?(parent)
      end
      overrides = @manifest.fetch("category_permission_overrides", {})
      unknown_permission_categories = overrides.keys - categories.keys
      if unknown_permission_categories.any?
        raise Error, "Category permission overrides reference unknown categories: #{unknown_permission_categories.join(", ")}"
      end
      (@manifest.fetch("category_permissions").values + overrides.values.flat_map(&:values)).each do |permission|
        next if supported_category_permission?(permission)

        raise Error, "Unknown category permission #{permission.inspect}"
      end

      @manifest.fetch("user_fields").each do |field|
        unless %w[dropdown multiselect].include?(field.fetch("type")) && field.fetch("options").all? { |option| option.is_a?(String) && !option.empty? }
          raise Error, "User field #{field.fetch("key")} must have a supported type and non-empty options"
        end
      end

      privacy = @manifest.fetch("user_field_defaults")
      expected_privacy = {
        "editable" => true,
        "requirement" => "on_signup",
        "show_on_signup" => true,
        "show_on_profile" => false,
        "show_on_user_card" => false,
        "searchable" => false
      }
      unless privacy == expected_privacy
        raise Error, "User field defaults must require editable signup fields that are private and not searchable"
      end

      automation = @manifest.fetch("automation")
      role_field = @manifest.fetch("user_fields").find { |field| field.fetch("key") == automation.fetch("field_key") }
      raise Error, "Automation field #{automation.fetch("field_key")} is missing" unless role_field
      groups = @manifest.fetch("groups").to_h { |group| [group.fetch("key"), group] }
      mapping = automation.fetch("mapping")
      unless mapping.keys.sort == role_field.fetch("options").sort
        raise Error, "Q1 automation must map every and only the Q1 options"
      end
      mapping.each do |answer, group_key|
        group = groups[group_key]
        raise Error, "Q1 answer #{answer} maps to missing group #{group_key}" unless group
        raise Error, "Q1 answer #{answer} must equal its target group full_name" unless group.fetch("full_name") == answer
      end
    end

    def validate_unique!(rows, key, noun)
      values = rows.map { |row| row.fetch(key) }
      duplicates = values.group_by(&:itself).select { |_value, duplicates| duplicates.size > 1 }.keys
      raise Error, "Duplicate #{noun}: #{duplicates.join(", ")}" if duplicates.any?
    end

    def supported_category_permission?(permission)
      if defined?(CategoryGroup)
        !CategoryGroup.permission_types[permission.to_sym].nil?
      else
        %w[full create_post readonly].include?(permission.to_s)
      end
    end

    def ensure_automation_available!
      unless defined?(DiscourseAutomation::Automation) && defined?(DiscourseAutomation::Scriptable)
        raise Error, "Discourse Automation is not loaded; Q1 role mapping cannot be installed"
      end

      script = @manifest.dig("automation", "script")
      if DiscourseAutomation::Scriptable.new(script).not_found
        raise Error, "Discourse Automation script #{script.inspect} is unavailable on this Discourse build"
      end
    end

    def reconcile_site_settings(apply:)
      @manifest.fetch("site_settings").each do |setting, raw_expected|
        expected = setting == "personal_message_enabled_groups" ? group_list_value(raw_expected) : raw_expected
        actual = SiteSetting.public_send(setting)
        next if actual == expected

        difference("site setting #{setting}: expected #{expected.inspect}, got #{actual.inspect}", apply: apply) do
          SiteSetting.set(setting, expected)
        end
      end
    end

    def group_list_value(group_names)
      group_names.map { |name| Group[name.to_sym].id }.join("|")
    rescue NoMethodError
      raise Error, "Missing built-in group required by site setting: #{group_names.inspect}"
    end

    def reconcile_groups(apply:)
      @manifest.fetch("groups").to_h do |definition|
        name = definition.fetch("name")
        group = Group.find_by(name: name)
        if group && group.custom_fields[owner_key("group_key")] != definition.fetch("key")
          conflict!("group #{name} exists but is not owned by #{MANIFEST_ID}", apply: apply)
          next [definition.fetch("key"), group]
        end

        unless group
          difference("group #{name} is missing", apply: apply) do
            group = Group.new(name: name)
            apply_group_attributes(group, definition)
            group.save!
            group.upsert_custom_fields(owner_key("group_key") => definition.fetch("key"))
          end
          next [definition.fetch("key"), group]
        end

        expected = group_attributes(definition)
        mismatches = expected.filter_map { |attribute, value| attribute.to_s if group.public_send(attribute) != value }
        if mismatches.any?
          difference("group #{name} differs in #{mismatches.join(", ")}", apply: apply) do
            apply_group_attributes(group, definition)
            group.save!
          end
        end
        [definition.fetch("key"), group]
      end
    end

    def group_attributes(definition)
      {
        full_name: definition.fetch("full_name"),
        visibility_level: Group.visibility_levels[:staff],
        members_visibility_level: Group.visibility_levels[:staff],
        mentionable_level: Group::ALIAS_LEVELS[:nobody],
        messageable_level: Group::ALIAS_LEVELS[:nobody],
        allow_membership_requests: false,
        automatic: false,
        grant_trust_level: nil,
        public_admission: false,
        public_exit: false,
        primary_group: false
      }
    end

    def apply_group_attributes(group, definition)
      group.assign_attributes(group_attributes(definition))
    end

    def reconcile_user_fields(apply:)
      @manifest.fetch("user_fields").each_with_index.to_h do |definition, index|
        key = definition.fetch("key")
        field = UserField.find_by(external_type: MANIFEST_TYPE, external_name: key)
        name_match = UserField.find_by(name: definition.fetch("question"))
        if !field && name_match
          conflict!("user field #{definition.fetch("question").inspect} exists but is not owned by #{MANIFEST_ID}", apply: apply)
          next [key, name_match]
        end

        unless field
          difference("user field #{key} is missing", apply: apply) do
            field = UserField.new
            apply_user_field_attributes(field, definition, index + 1)
            field.save!
            replace_options(field, definition.fetch("options"))
          end
          next [key, field]
        end

        expected = user_field_attributes(definition, index + 1)
        mismatches = expected.filter_map { |attribute, value| attribute.to_s if field.public_send(attribute) != value }
        options_match = field.user_field_options.order(:id).pluck(:value) == definition.fetch("options")
        if mismatches.any? || !options_match
          details = mismatches + (options_match ? [] : ["options"])
          difference("user field #{key} differs in #{details.join(", ")}", apply: apply) do
            apply_user_field_attributes(field, definition, index + 1)
            field.save!
            replace_options(field, definition.fetch("options")) unless options_match
          end
        end
        [key, field]
      end
    end

    def user_field_attributes(definition, position)
      {
        name: definition.fetch("question"),
        description: definition.fetch("question"),
        field_type: definition.fetch("type"),
        position: position,
        external_type: MANIFEST_TYPE,
        external_name: definition.fetch("key")
      }.merge(@manifest.fetch("user_field_defaults").transform_keys(&:to_sym))
    end

    def apply_user_field_attributes(field, definition, position)
      field.assign_attributes(user_field_attributes(definition, position))
    end

    def replace_options(field, options)
      field.user_field_options.delete_all
      options.each { |value| field.user_field_options.create!(value: value) }
    end

    def reconcile_categories(apply:)
      categories = {}
      @manifest.fetch("categories").each do |definition|
        key = definition.fetch("key")
        parent = definition["parent"] ? categories.fetch(definition.fetch("parent")) : nil
        if definition["parent"] && parent.nil?
          @drift << "category #{definition.fetch("slug")} cannot be checked because parent #{definition.fetch("parent")} is missing" unless apply
          next
        end
        category = Category.find_by(slug: definition.fetch("slug"), parent_category_id: parent&.id)
        if category && category.custom_fields[owner_key("category_key")] != key
          conflict!("category #{definition.fetch("slug")} exists but is not owned by #{MANIFEST_ID}", apply: apply)
          categories[key] = category
          next
        end

        unless category
          difference("category #{definition.fetch("slug")} is missing", apply: apply) do
            category = Category.new
            apply_category_attributes(category, definition, parent)
            category.user = Discourse.system_user
            category.set_permissions(normalized_permissions(category_permissions_for(definition)))
            category.save!
            category.upsert_custom_fields(owner_key("category_key") => key)
          end
          categories[key] = category
          next
        end

        expected = category_attributes(definition, parent)
        mismatches = expected.filter_map { |attribute, value| attribute.to_s if category.public_send(attribute) != value }
        expected_permissions = normalized_permissions(category_permissions_for(definition))
        # Core stores everyone/full as an unrestricted category with no ACL rows.
        stored_permissions = expected_permissions["everyone"] == CategoryGroup.permission_types[:full] ? {} : expected_permissions
        expected_restricted = !expected_permissions.key?("everyone")
        permissions_match = normalized_permissions(category.permissions_params) == stored_permissions && category.read_restricted == expected_restricted
        if mismatches.any? || !permissions_match
          details = mismatches + (permissions_match ? [] : ["permissions"])
          difference("category #{definition.fetch("slug")} differs in #{details.join(", ")}", apply: apply) do
            apply_category_attributes(category, definition, parent)
            category.set_permissions(expected_permissions) unless permissions_match
            category.save!
          end
        end
        categories[key] = category
      end
    end

    def category_attributes(definition, parent)
      {
        name: definition.fetch("name"),
        slug: definition.fetch("slug"),
        parent_category_id: parent&.id,
        position: definition.fetch("position")
      }
    end

    def apply_category_attributes(category, definition, parent)
      category.assign_attributes(category_attributes(definition, parent))
    end

    def category_permissions_for(definition)
      @manifest.fetch("category_permissions").merge(
        @manifest.fetch("category_permission_overrides", {}).fetch(definition.fetch("key"), {})
      )
    end

    def normalized_permissions(permissions)
      permissions.to_h.transform_keys(&:to_s).transform_values do |value|
        value.is_a?(String) || value.is_a?(Symbol) ? CategoryGroup.permission_types.fetch(value.to_sym) : value
      end
    end

    def reconcile_role_automation(field, groups, apply:)
      definition = @manifest.fetch("automation")
      name = definition.fetch("name")
      unless field
        @drift << "automation #{name.inspect} cannot be checked because its user field is missing" unless apply
        return
      end
      matching = DiscourseAutomation::Automation.where(name: name).to_a
      if matching.size > 1
        conflict!("multiple automations are named #{name.inspect}", apply: apply)
        return
      end
      automation = matching.first
      if automation && (automation.script != definition.fetch("script") || automation.trigger != definition.fetch("trigger"))
        conflict!("automation #{name.inspect} exists with a different script or trigger", apply: apply)
        return
      end

      expected_field = { "value" => field.id }
      current_field = automation&.script_field("custom_field_name")
      needs_update = !automation || !automation.enabled? || current_field != expected_field
      unless needs_update
        mapping = definition.fetch("mapping")
        mapping.each do |answer, group_key|
          unless groups.fetch(group_key)&.full_name == answer
            @drift << "automation group #{group_key} no longer has Q1 answer #{answer.inspect} as full_name"
          end
        end
        return
      end

      difference("automation #{name.inspect} is missing or differs", apply: apply) do
        automation ||= DiscourseAutomation::Automation.new(
          name: name,
          script: definition.fetch("script"),
          trigger: definition.fetch("trigger"),
          last_updated_by_id: Discourse.system_user.id
        )
        automation.assign_attributes(
          name: name,
          script: definition.fetch("script"),
          trigger: definition.fetch("trigger"),
          enabled: false,
          last_updated_by_id: Discourse.system_user.id
        )
        automation.save!
        automation.upsert_field!("custom_field_name", "custom_field", expected_field, target: "script")
        automation.perform_required_fields_validation = true
        automation.update!(enabled: true, last_updated_by_id: Discourse.system_user.id)
      end
    end

    def owner_key(suffix)
      "#{OWNER_FIELD_PREFIX}.#{suffix}"
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

# `rails runner` evaluates the file on require, so automatic execution would
# make it impossible for RSpec to use the class safely. This opt-in guard keeps
# the file-runner form available without making a require mutate state.
ThatSpace::CommunityBootstrap.run_cli! if ENV["THAT_SPACE_COMMUNITY_BOOTSTRAP"] == "1"
