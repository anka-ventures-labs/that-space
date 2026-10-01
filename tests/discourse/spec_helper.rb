# frozen_string_literal: true

# These specs are copied into Discourse's spec/that_space directory by the
# integration runner.  They deliberately load the checked-out configuration
# from THAT_SPACE_REPO instead of carrying a second copy of it into the
# Discourse checkout.
require "rails_helper"
require "json"

module ThatSpaceCommunitySpecSupport
  REPO_ROOT = Pathname.new(ENV.fetch("THAT_SPACE_REPO"))
  MANIFEST_PATH = REPO_ROOT.join("discourse/community/manifest.json").freeze
  BOOTSTRAP_PATH = REPO_ROOT.join("discourse/community/bootstrap.rb").freeze

  raise "That Space community manifest is missing: #{MANIFEST_PATH}" unless MANIFEST_PATH.file?
  raise "That Space community bootstrap is missing: #{BOOTSTRAP_PATH}" unless BOOTSTRAP_PATH.file?

  require BOOTSTRAP_PATH.to_s

  def that_space_manifest
    @that_space_manifest ||= JSON.parse(File.read(MANIFEST_PATH))
  end

  def that_space_bootstrap
    ThatSpace::CommunityBootstrap.new(manifest_path: MANIFEST_PATH.to_s)
  end

  def apply_that_space_community!
    that_space_bootstrap.apply!
  end

  def configured_category(key)
    definition = that_space_manifest.fetch("categories").find { |item| item.fetch("key") == key }
    Category.find_by!(slug: definition.fetch("slug"))
  end

  def configured_group(key)
    definition = that_space_manifest.fetch("groups").find { |item| item.fetch("key") == key }
    Group.find_by!(name: definition.fetch("name"))
  end

  def configured_user_field(key)
    definition = that_space_manifest.fetch("user_fields").find { |item| item.fetch("key") == key }
    UserField.find_by!(name: definition.fetch("question"))
  end

  def that_space_signup_fields
    that_space_manifest.fetch("user_fields").to_h do |definition|
      field = configured_user_field(definition.fetch("key"))
      first_option = definition.fetch("options").first
      [field.id.to_s, definition.fetch("type") == "multiselect" ? [first_option] : first_option]
    end
  end
end

RSpec.configure do |config|
  config.fail_if_no_examples = true
  config.include ThatSpaceCommunitySpecSupport
end
