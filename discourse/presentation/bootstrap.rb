# frozen_string_literal: true

require "json"
require "digest"

module ThatSpace
  # Runs inside the pinned Discourse checkout after CommunityBootstrap. Imports
  # local, pinned sources; it never downloads code or takes over an existing theme.
  #
  # Members use core Horizon with the Thật Space brand component on top. The
  # design and its rationale are in docs/design/member-happy-path.md.
  class PresentationBootstrap
    STORE = "that_space_presentation"
    # The pre-Horizon full theme was owned under "theme". It is left installed
    # and unselected so it remains a one-setting rollback target.
    BRAND_KEY = "brand"
    LEGACY_THEME_KEY = "theme"
    PALETTE_KEY = "palette"
    SIDEBAR_KEY = "sidebar"
    PALETTE_NAME = "Thật Space Horizon"
    Result = Struct.new(:changes, :drift, keyword_init: true)
    class Error < StandardError; end

    def initialize(repo_path: File.expand_path("../..", __dir__), runtime_path: Rails.root)
      @repo = File.expand_path(repo_path.to_s)
      @runtime = File.expand_path(runtime_path.to_s)
      @lock = JSON.parse(File.read(File.join(@repo, "discourse/runtime.lock.json")))
      @palette = JSON.parse(File.read(File.join(@repo, "discourse/presentation/palette.json")))
    end

    def apply!
      run(apply: true)
    end

    def check!
      run(apply: false)
    end

    def theme
      record = PluginStore.get(STORE, BRAND_KEY)
      record && Theme.find_by(id: record.fetch("id"))
    end

    def legacy_theme
      record = PluginStore.get(STORE, LEGACY_THEME_KEY)
      record && Theme.find_by(id: record.fetch("id"))
    end

    private

    def run(apply:)
      @changes = []
      @drift = []
      gallery = owned_category!("exhibition")
      retreat = owned_category!("retreat-workshop")
      introduction = owned_category!("introduction")
      sidebar_categories = %w[introduction healing-growth art-creation spirituality-tu-vi relationships].map { |key| owned_category!(key) }
      host = Group.find_by!(name: "ts-role-host")
      unless host.custom_fields["that_space.community.group_key"] == "role.host"
        raise Error, "Host interest group is not owned by the community manifest"
      end

      # Refuse an unrecognised sidebar before any write, then import and
      # configure everything fallible before the visible cutover below.
      sidebar_plan = community_section_plan(gallery)
      horizon = Theme.horizon_theme
      unless horizon
        difference("install core Horizon theme", apply: apply) { SystemThemesManager.sync_theme!("horizon") }
        horizon = Theme.horizon_theme
      end

      brand = import_owned(BRAND_KEY, File.join(@repo, "discourse/theme"), component: true, apply: apply)
      components = @lock.fetch("components").to_h do |pin|
        path = File.join(@runtime, "tmp/that-space-components", pin.fetch("name"))
        [pin.fetch("name"), import_owned(pin.fetch("name"), path, component: true, apply: apply)]
      end
      palette = reconcile_palette(apply: apply)
      ready = horizon && brand && palette && components.values.all?
      configure_imported(brand, components, gallery, introduction, apply: apply) if ready

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
        "ignore_allowed_groups" => [Group[:admins].id, Group[:moderators].id, Group[:trust_level_0].id].join("|"),
        # Member happy path: one feed, one navigation, no tutorial or tip popups.
        "top_menu" => "latest",
        "enable_user_tips" => false,
        "discourse_narrative_bot_enabled" => false,
        # Chat is for one-to-one conversations only (Bà Mối today, match
        # chats next): no public channels, no group chats, uploads allowed.
        "chat_enabled" => true,
        "enable_public_channels" => false,
        "chat_allowed_groups" => [Group[:admins].id, Group[:moderators].id, Group[:trust_level_0].id].join("|"),
        "direct_message_enabled_groups" => [Group[:admins].id, Group[:moderators].id, Group[:trust_level_0].id].join("|"),
        "chat_max_direct_message_users" => 1,
        "chat_allow_uploads" => true,
        "tagging_enabled" => false,
        "allow_uncategorized_topics" => false,
        "sidebar_show_upcoming_events" => false,
        "default_navigation_menu_categories" => sidebar_categories.map(&:id).join("|")
      }
      settings.each do |key, expected|
        difference("site setting #{key}", apply: apply) { SiteSetting.set(key, expected) } unless SiteSetting.public_send(key) == expected
      end
      reconcile_vi_labels(apply: apply)
      reconcile_community_section(sidebar_plan, apply: apply)

      unless ready
        @drift << "theme-dependent settings and attachments cannot be checked until Horizon and the pinned themes are imported"
        return result
      end

      reconcile_horizon_settings(horizon, apply: apply)
      required = [brand.id] + components.values.map(&:id)
      missing = required - horizon.child_theme_ids
      difference("attach brand, portfolio and thumbnails to Horizon", apply: apply) { horizon.child_theme_ids = horizon.child_theme_ids | required } if missing.any?
      unless horizon.color_scheme_id == palette.id && horizon.dark_color_scheme_id.nil?
        # A single light palette: Horizon's stock dark palettes are not branded.
        difference("Horizon palette", apply: apply) { horizon.update!(color_scheme_id: palette.id, dark_color_scheme_id: nil) }
      end
      difference("default member theme", apply: apply) { SiteSetting.default_theme_id = horizon.id } unless SiteSetting.default_theme_id == horizon.id
      Theme.clear_cache! if apply && @changes.any?
      result
    end

    def configure_imported(brand, components, gallery, introduction, apply:)
      logo = brand.theme_fields.find_by(name: "that-space-logo")&.upload
      if logo
        %w[logo logo_small mobile_logo].each do |setting|
          difference("site setting #{setting}", apply: apply) { SiteSetting.set(setting, logo) } unless SiteSetting.public_send(setting) == logo
        end
      else
        @drift << "brand component logo is missing; native header branding cannot be checked"
      end

      configure(brand, { "introduction_category_id" => introduction.id }, apply: apply)
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
    end

    def owned_category!(key)
      row = CategoryCustomField.find_by(name: "that_space.community.category_key", value: key)
      raise Error, "Apply the community manifest first (missing category #{key})" unless row
      Category.find(row.category_id)
    end

    # Themeable site settings live on the theme. Horizon ships the welcome
    # banner on; core keeps an owner's override across Horizon re-syncs.
    def reconcile_horizon_settings(horizon, apply:)
      { "enable_welcome_banner" => false }.each do |name, expected|
        next if SiteSetting.public_send(name, theme_id: horizon.id) == expected

        difference("Horizon setting #{name}", apply: apply) do
          outcome = Themes::ThemeSiteSettingManager.call(
            params: { theme_id: horizon.id, name: name, value: expected },
            guardian: Discourse.system_user.guardian
          )
          raise Error, "Horizon setting #{name} could not be saved" unless outcome.success?
        end
      end
    end

    # Plain Vietnamese for the member's writing path. Core vi lacks some
    # composer labels (they fell back to English) and uses forum jargon
    # ("chủ đề", "tút", "Markdown, BBCode") elsewhere.
    VI_LABELS = {
      "js.topic.create" => "Viết bài",
      "js.composer.create_topic" => "Đăng bài",
      "js.composer.reply_placeholder" => "Viết điều bạn muốn chia sẻ… Bạn có thể kéo thả hoặc dán hình ảnh vào đây.",
      "js.composer.composer_actions.create_topic.label" => "Viết bài mới",
      "js.composer.composer_actions.create_topic.desc" => "Đăng một bài mới cho cả cộng đồng",
      "js.composer.composer_actions.create_personal_message.label" => "Viết tin nhắn riêng",
      "js.composer.composer_actions.reply_to_message.label" => "Trả lời tin nhắn",
      "js.composer.composer_actions.reply_to_message.desc" => "Trả lời cả cuộc trò chuyện",
      "js.composer.composer_actions.reply_to_post.label" => "Trả lời bài của %{postUsername}",
      "js.composer.composer_actions.reply_to_post.desc" => "Trả lời riêng một bài viết",
      "js.composer.composer_actions.reply_to_topic.desc" => "Trả lời cả bài, không nhắm vào bình luận nào"
    }.freeze

    def reconcile_vi_labels(apply:)
      VI_LABELS.each do |key, expected|
        current = TranslationOverride.find_by(locale: "vi", translation_key: key)&.value
        difference("vi label #{key}", apply: apply) { TranslationOverride.upsert!("vi", key, expected) } unless current == expected
      end
    end

    def community_links(gallery)
      # Review and Admin render only for staff; core hides them for members.
      [
        ["Bảng tin", "/latest", "house", "primary"],
        ["Sự kiện", "/upcoming-events", "calendar-days", "primary"],
        ["Triển lãm", gallery.url, "far-image", "primary"],
        ["Tin nhắn", "/my/messages", "inbox", "primary"],
        ["Kiểm duyệt", "/review", "flag", "primary"],
        ["Quản trị", "/admin", "wrench", "primary"],
        ["Về Thật Space", "/about", "circle-info", "secondary"],
        ["Nội quy", "/faq", "circle-question", "secondary"]
      ]
    end

    # The community section is a core record that admins can edit. Only a
    # section of core links or one this bootstrap wrote is replaced; custom
    # admin or plugin links are refused before any write.
    def community_section_plan(gallery)
      section = SidebarSection.find_by(section_type: "community")
      unless section
        @drift << "core community sidebar section is missing; sidebar links cannot be checked"
        return nil
      end
      expected = community_links(gallery)
      current = section.sidebar_section_links.includes(:linkable).map do |link|
        url = link.linkable
        url.is_a?(SidebarUrl) ? [url.name, url.value, url.icon, url.segment] : [link.linkable_type, link.linkable_id]
      end
      return { section: section, expected: expected, current: current } if current == expected

      # Core-only: every link is a core community path (names may be edited).
      core_only = current.all? { |link| link.length == 4 && SidebarUrl::COMMUNITY_SECTION_LINK_PATHS.include?(link[1]) }
      unless core_only || PluginStore.get(STORE, SIDEBAR_KEY)
        raise Error, "Community sidebar has unrecognised links; refusing takeover. Reset it in Admin → Sidebar or remove the custom links first"
      end
      { section: section, expected: expected, current: current }
    end

    def reconcile_community_section(plan, apply:)
      return unless plan
      return if plan[:current] == plan[:expected] && PluginStore.get(STORE, SIDEBAR_KEY)

      section = plan[:section]
      difference("community sidebar links", apply: apply) do
        SidebarSection.transaction do
          if plan[:current] != plan[:expected]
            urls = section.sidebar_urls.to_a
            section.sidebar_section_links.destroy_all
            urls.each(&:destroy!)
            plan[:expected].each_with_index do |(name, value, icon, segment), position|
              url = SidebarUrl.create!(name: name, value: value, icon: icon, segment: segment, external: false)
              SidebarSectionLink.create!(user_id: Discourse.system_user.id, linkable: url, sidebar_section: section, position: position)
            end
          end
          PluginStore.set(STORE, SIDEBAR_KEY, { "section_id" => section.id })
        end
        Site.clear_anon_cache!
      end
    end

    def reconcile_palette(apply:)
      colors = @palette.fetch("colors")
      record = PluginStore.get(STORE, PALETTE_KEY)
      scheme = record && ColorScheme.find_by(id: record.fetch("id"))
      raise Error, "Owned palette was replaced with a different color scheme" if scheme && scheme.name != PALETTE_NAME
      if !record && ColorScheme.exists?(name: PALETTE_NAME)
        raise Error, "Color scheme #{PALETTE_NAME.inspect} already exists without an ownership record; refusing takeover"
      end
      unless scheme
        difference("create #{PALETTE_NAME} palette", apply: apply) do
          scheme = ColorScheme.create_from_base(name: PALETTE_NAME, colors: colors)
          raise Error, "Palette could not be created: #{scheme.errors.full_messages.join(", ")}" unless scheme.persisted?
          PluginStore.set(STORE, PALETTE_KEY, { "id" => scheme.id })
        end
        return scheme
      end
      actual = scheme.colors.to_h { |color| [color.name, color.hex.downcase] }
      changed = colors.reject { |name, hex| actual[name] == hex.downcase }
      if changed.any?
        difference("#{PALETTE_NAME} palette colors #{changed.keys.sort.join(", ")}", apply: apply) do
          changed.each do |name, hex|
            color = scheme.color_scheme_colors.find { |item| item.name == name } || scheme.color_scheme_colors.build(name: name)
            color.hex = hex
          end
          scheme.save!
        end
      end
      scheme
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
