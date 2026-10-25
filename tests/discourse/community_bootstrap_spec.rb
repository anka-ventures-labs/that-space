# frozen_string_literal: true

require_relative "spec_helper"

RSpec.describe "Thật Space community bootstrap" do
  it "has an explicit, inert Ruby entrypoint" do
    expect(ThatSpace::CommunityBootstrap::MANIFEST_ID).to eq("that-space-community")
    expect(ThatSpace::CommunityBootstrap::MANIFEST_TYPE).to eq("that-space-community")
    expect(ThatSpace::CommunityBootstrap).to respond_to(:new)
  end

  it "creates the manifest's core records and is idempotent" do
    first = apply_that_space_community!
    second = apply_that_space_community!

    expect(first).to be_a(ThatSpace::CommunityBootstrap::Result)
    expect(second).to be_a(ThatSpace::CommunityBootstrap::Result)
    expect(first.drift).to be_empty
    expect(second.changes).to be_empty
    expect(second.drift).to be_empty

    that_space_manifest.fetch("site_settings").except("personal_message_enabled_groups").each do |setting, expected|
      actual = SiteSetting.public_send(setting)
      expect(actual).to eq(expected), "expected SiteSetting.#{setting} to match the manifest"
    end

    pm_group_ids = SiteSetting.personal_message_enabled_groups.split("|").map(&:to_i)
    expect(pm_group_ids).to include(
      Group[:admins].id,
      Group[:moderators].id,
      Group[:trust_level_0].id,
    )

    adult_attestation = configured_user_field("adult_attestation")
    expect(adult_attestation.on_signup?).to eq(true)
    expect(adult_attestation.show_on_profile).to eq(false)
    expect(adult_attestation.show_on_user_card).to eq(false)
    expect(adult_attestation.searchable).to eq(false)

    that_space_manifest.fetch("groups").each do |definition|
      group = Group.find_by!(name: definition.fetch("name"))
      expect(group.full_name).to eq(definition.fetch("full_name"))
      expect(group.staff?).to eq(false)
      expect(group.automatic).to eq(false)
      expect(group.grant_trust_level).to be_nil
      expect(group.public_admission).to eq(false)
      expect(group.public_exit).to eq(false)
      expect(group.primary_group).to eq(false)
      expect(group.visibility_level).to eq(Group.visibility_levels[:staff])
      expect(group.members_visibility_level).to eq(Group.visibility_levels[:staff])
      expect(group.mentionable_level).to eq(Group::ALIAS_LEVELS[:nobody])
      expect(group.messageable_level).to eq(Group::ALIAS_LEVELS[:nobody])
      expect(group.allow_membership_requests).to eq(false)
    end

    that_space_manifest.fetch("categories").each do |definition|
      category = Category.find_by!(slug: definition.fetch("slug"))
      expect(category.name).to eq(definition.fetch("name"))
      expect(category.position).to eq(definition.fetch("position"))
      expected_parent = definition["parent"] && configured_category(definition.fetch("parent"))
      expect(category.parent_category).to eq(expected_parent)
      expect(category.user).to eq(Discourse.system_user)
    end

    that_space_manifest.fetch("categories").each do |definition|
      category = Category.find_by!(slug: definition.fetch("slug"))
      expected_permissions = expected_category_permissions(definition).transform_values do |permission_name|
        CategoryGroup.permission_types.fetch(permission_name.to_sym)
      end
      if expected_permissions == { "everyone" => CategoryGroup.permission_types[:full] }
        expect(category.category_groups).to be_empty
      else
        expect(category.permissions_params).to eq(expected_permissions)
      end
      expect(category.read_restricted).to eq(false)
    end
  end

  it "keeps announcements readable by members and postable only by staff" do
    apply_that_space_community!

    announcements = configured_category("announcements")
    member = Fabricate(:user, refresh_auto_groups: true)
    staff = Fabricate(:admin)

    expect(Guardian.new(member).can_see_category?(announcements)).to eq(true)
    expect(Guardian.new(member).can_post_in_category?(announcements)).to eq(false)
    expect(Guardian.new(staff).can_post_in_category?(announcements)).to eq(true)
  end

  it "creates private editable fields, asking only membership questions at signup" do
    apply_that_space_community!

    defaults = that_space_manifest.fetch("user_field_defaults")
    that_space_manifest.fetch("user_fields").each do |definition|
      field = UserField.find_by!(name: definition.fetch("question"))
      expect(field.field_type).to eq(definition.fetch("type"))
      defaults.each do |attribute, expected|
        expect(field.public_send(attribute)).to eq(expected)
      end
      if definition.fetch("asked", "signup") == "signup"
        expect(field.on_signup?).to eq(true)
        expect(field.show_on_signup).to eq(true)
      else
        expect(field.optional?).to eq(true)
        expect(field.show_on_signup).to eq(false)
      end
      expect(field.for_all_users?).to eq(false)
      expect(field.user_field_options.pluck(:value)).to eq(definition.fetch("options"))
    end
  end

  it "refuses existing categories, groups and signup questions without taking ownership" do
    category_definition = that_space_manifest.fetch("categories").first
    category = Fabricate(:category, slug: category_definition.fetch("slug"))
    group_definition = that_space_manifest.fetch("groups").first
    group = Fabricate(:group, name: group_definition.fetch("name"), full_name: "Existing group's purpose")
    expect { apply_that_space_community! }.to raise_error(ThatSpace::CommunityBootstrap::ConflictError, /group/)
    expect(group.reload.full_name).to eq("Existing group's purpose")
    group.destroy!

    question = that_space_manifest.fetch("user_fields").first.fetch("question")
    field = UserField.create!(name: question, field_type: "text", description: "Existing private field")
    expect { apply_that_space_community! }.to raise_error(ThatSpace::CommunityBootstrap::ConflictError, /user field/)
    expect(field.reload.external_type).not_to eq(ThatSpace::CommunityBootstrap::MANIFEST_TYPE)
    field.destroy!

    expect { apply_that_space_community! }.to raise_error(ThatSpace::CommunityBootstrap::ConflictError, /category/)
    expect(category.reload.custom_fields["that_space.community.category_key"]).to be_nil
  end

  it "detects drift without mutating and offers a raising check" do
    apply_that_space_community!
    SiteSetting.title = "Unexpected title"

    result = that_space_bootstrap.check!

    expect(result).to be_a(ThatSpace::CommunityBootstrap::Result)
    expect(result.drift).not_to be_empty
    expect { that_space_bootstrap.check_or_raise! }.to raise_error(ThatSpace::CommunityBootstrap::DriftError)
    expect(SiteSetting.title).to eq("Unexpected title")
  end

  it "uses the installed native Automation script for first-login role membership" do
    expect(defined?(DiscourseAutomation::Automation)).to be_present
    expect(defined?(DiscourseAutomation::Scripts::ADD_USER_TO_GROUP_THROUGH_CUSTOM_FIELD)).to be_present
    expect(defined?(DiscourseAutomation::Triggers::USER_FIRST_LOGGED_IN)).to be_present

    apply_that_space_community!

    definition = that_space_manifest.fetch("automation")
    role_field = configured_user_field(definition.fetch("field_key"))
    automation = DiscourseAutomation::Automation.find_by!(name: definition.fetch("name"))

    expect(automation.enabled).to eq(true)
    expect(automation.script).to eq(DiscourseAutomation::Scripts::ADD_USER_TO_GROUP_THROUGH_CUSTOM_FIELD)
    expect(automation.trigger).to eq(DiscourseAutomation::Triggers::USER_FIRST_LOGGED_IN)
    script_field = automation.fields.find_by!(target: "script", name: "custom_field_name")
    expect(script_field.metadata).to include("value" => role_field.id)

    selected_answer, group_key = definition.fetch("mapping").first
    group = configured_group(group_key)
    member = Fabricate(:user)
    member.set_user_field(role_field.id, selected_answer)
    member.save_custom_fields

    automation.trigger!(
      "kind" => DiscourseAutomation::Triggers::USER_FIRST_LOGGED_IN,
      "user" => member,
    )

    expect(member.reload.in_any_groups?([group.id])).to eq(true)
  end

  def expected_category_permissions(definition)
    that_space_manifest.fetch("category_permissions").merge(
      that_space_manifest.fetch("category_permission_overrides", {}).fetch(definition.fetch("key"), {})
    )
  end
end
