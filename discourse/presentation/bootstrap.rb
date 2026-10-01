# frozen_string_literal: true

require "json"
require "digest"

module ThatSpace
  # Runs inside the pinned Discourse checkout after CommunityBootstrap. Imports
  # local, pinned sources; it never downloads code or takes over an existing theme.
  class PresentationBootstrap
    STORE = "that_space_presentation"
    Result = Struct.new(:changes, :drift, keyword_init: true)
    class Error < StandardError; end

    def initialize(repo_path: File.expand_path("../..", __dir__), runtime_path: Rails.root)
      @repo = File.expand_path(repo_path.to_s)
      @runtime = File.expand_path(runtime_path.to_s)
      @lock = JSON.parse(File.read(File.join(@repo, "discourse/runtime.lock.json")))
    end

    def apply!
      run(apply: true)
    end

    def check!
      run(apply: false)
    end

    def theme
      record = PluginStore.get(STORE, "theme")
      record && Theme.find_by(id: record.fetch("id"))
    end

    private

    def run(apply:)
      @changes = []
      @drift = []
      gallery = owned_category!("exhibition")
      retreat = owned_category!("retreat-workshop")
      host = Group.find_by!(name: "ts-role-host")
      unless host.custom_fields["that_space.community.group_key"] == "role.host"
        raise Error, "Host interest group is not owned by the community manifest"
      end

      settings = {
        "hide_user_profiles_from_public" => true,
        "hide_new_user_profiles" => false,
        "allow_featured_topic_on_user_profiles" => true,
        "allow_profile_backgrounds" => true,
        "prevent_anons_from_downloading_files" => true,
        "discourse_follow_enabled" => true,
        "follow_followers_visible" => "trust_level_0",
        "follow_following_visible" => "trust_level_0",
        "follow_notifications_enabled" => true,
        "default_notify_me_when_followed_creates_topic" => true,
        "discourse_events_enabled" => true,
        "discourse_post_event_enabled" => true,
        "discourse_post_event_allowed_on_groups" => [Group[:admins].id, Group[:moderators].id, host.id].join("|"),
        "events_calendar_categories" => retreat.id.to_s,
        "flag_post_allowed_groups" => [Group[:admins].id, Group[:moderators].id, Group[:trust_level_0].id].join("|"),
        "ignore_allowed_groups" => [Group[:admins].id, Group[:moderators].id, Group[:trust_level_0].id].join("|")
      }
      settings.each do |key, expected|
        difference("site setting #{key}", apply: apply) { SiteSetting.set(key, expected) } unless SiteSetting.public_send(key) == expected
      end

      parent = import_owned("theme", File.join(@repo, "discourse/theme"), component: false, apply: apply)
      components = @lock.fetch("components").to_h do |pin|
        path = File.join(@runtime, "tmp/that-space-components", pin.fetch("name"))
        [pin.fetch("name"), import_owned(pin.fetch("name"), path, component: true, apply: apply)]
      end
      unless parent && components.values.all?
        @drift << "theme-dependent settings and attachments cannot be checked until the pinned themes are imported"
        return result
      end

      logo = parent.theme_fields.find_by(name: "that-space-logo")&.upload
      if logo
        %w[logo logo_small mobile_logo].each do |setting|
          difference("site setting #{setting}", apply: apply) { SiteSetting.set(setting, logo) } unless SiteSetting.public_send(setting) == logo
        end
      else
        @drift << "member theme logo is missing; native header branding cannot be checked"
      end

      configure(parent, { "gallery_path" => gallery.url, "events_path" => "/upcoming-events" }, apply: apply)
      portfolio = components.fetch("discourse-user-portfolio")
      configure(portfolio, { "portfolio_category" => gallery.id, "portfolio_thumbnail_style" => "grid" }, apply: apply)
      configure(components.fetch("discourse-topic-thumbnails"), {
        "default_thumbnail_mode" => "none", "grid_categories" => gallery.id.to_s, "mobile_thumbnails" => true
      }, apply: apply)
      { "portfolio" => "Tác phẩm", "empty_portfolio" => "Tác phẩm của bạn sẽ xuất hiện ở đây", "empty_portfolio_link" => "Bắt đầu bằng cách đăng tác phẩm tại" }.each do |key, text|
        current = portfolio.theme_translation_overrides.find_by(locale: "vi", translation_key: key)&.value
        difference("portfolio translation #{key}", apply: apply) do
          portfolio.theme_translation_overrides.find_or_initialize_by(locale: "vi", translation_key: key).update!(value: text)
        end unless current == text
      end

      required = components.values.map(&:id)
      missing = required - parent.child_theme_ids
      difference("attach portfolio and thumbnails", apply: apply) { parent.child_theme_ids = parent.child_theme_ids | required } if missing.any?
      difference("default member theme", apply: apply) { SiteSetting.default_theme_id = parent.id } unless SiteSetting.default_theme_id == parent.id
      Theme.clear_cache! if apply && @changes.any?
      result
    end

    def owned_category!(key)
      row = CategoryCustomField.find_by(name: "that_space.community.category_key", value: key)
      raise Error, "Apply the community manifest first (missing category #{key})" unless row
      Category.find(row.category_id)
    end

    def import_owned(key, path, component:, apply:)
      raise Error, "Pinned theme source is missing: #{path}" unless File.file?(File.join(path, "about.json"))
      name = JSON.parse(File.read(File.join(path, "about.json"))).fetch("name")
      record = PluginStore.get(STORE, key)
      existing = record && Theme.find_by(id: record.fetch("id"))
      if !record && Theme.exists?(name: name)
        raise Error, "Theme #{name.inspect} already exists without an ownership record; refusing takeover"
      end
      raise Error, "Owned theme #{key} was replaced with a different theme" if existing && existing.name != name
      source_digest = directory_digest(path)
      database_digest = existing && fields_digest(existing)
      changed = !existing || record["source_digest"] != source_digest || record["fields_digest"] != database_digest || existing.auto_update || existing.component != component
      if changed
        difference("import pinned #{key}", apply: apply) do
          existing = RemoteTheme.import_theme_from_directory(path, theme_id: existing&.id)
          raise Error, "Unexpected component type for #{key}" unless existing.component == component
          existing.update!(auto_update: false)
          PluginStore.set(STORE, key, { "id" => existing.id, "source_digest" => source_digest, "fields_digest" => fields_digest(existing) })
        end
      end
      existing
    end

    def configure(theme, settings, apply:)
      settings.each do |key, value|
        next if theme.get_setting(key) == value
        difference("#{theme.name} setting #{key}", apply: apply) { theme.update_setting(key, value) }
      end
    end

    def directory_digest(path)
      files = Dir.glob(File.join(path, "**", "*"), File::FNM_DOTMATCH).select { |file| File.file?(file) && !file.include?("/.git/") }.sort
      Digest::SHA256.hexdigest(files.map { |file| [file.delete_prefix(path), Digest::SHA256.file(file).hexdigest].join(":") }.join("\n"))
    end

    def fields_digest(theme)
      Digest::SHA256.hexdigest(theme.theme_fields.order(:target_id, :name).pluck(:target_id, :name, :type_id, :value).to_json)
    end

    def difference(message, apply:)
      if apply
        yield
        @changes << message
      else
        @drift << message
      end
    end

    def result
      Result.new(changes: @changes.dup, drift: @drift.dup)
    end
  end
end

if ENV["THAT_SPACE_PRESENTATION_BOOTSTRAP"] == "1"
  check = ARGV.delete("--check")
  installer = ThatSpace::PresentationBootstrap.new
  result = check ? installer.check! : installer.apply!
  result.changes.each { |message| puts "CHANGED: #{message}" }
  result.drift.each { |message| puts "DRIFT: #{message}" }
  exit(1) if check && result.drift.any?
end
