# frozen_string_literal: true

require_relative "spec_helper"
require ThatSpaceCommunitySpecSupport::REPO_ROOT.join("discourse/presentation/bootstrap.rb").to_s

# The member happy path from docs/design/member-happy-path.md, on real Horizon.
RSpec.describe "Thật Space member theme", type: :system do
  let!(:member) { Fabricate(:user, refresh_auto_groups: true) }

  let(:theme_directory) { ThatSpaceCommunitySpecSupport::REPO_ROOT.join("discourse/theme").to_s }

  let!(:that_space_theme) do
    raise "That Space theme is missing: #{theme_directory}" unless File.directory?(theme_directory)

    apply_that_space_community!
    installer = ThatSpace::PresentationBootstrap.new(repo_path: ThatSpaceCommunitySpecSupport::REPO_ROOT)
    installer.apply!
    Theme.clear_cache!
    installer.theme
  end

  after { Theme.clear_cache! }

  def retain_theme_screenshot(name)
    directory = Rails.root.join("tmp/screenshots")
    FileUtils.mkdir_p(directory)
    page.save_screenshot(directory.join("#{name}.png").to_s)
  end

  it "lands a new member on one feed with one obvious first step" do
    sign_in(member)
    visit "/"

    expect(that_space_theme).to be_persisted
    expect(page).to have_css(".that-space-first-step", visible: true)
    within(".sidebar-wrapper") do
      %w[Bảng\ tin Sự\ kiện Triển\ lãm Hộp\ thư].each { |name| expect(page).to have_link(name) }
      expect(page).to have_no_link("Quản trị")
      expect(page).to have_no_link("Kiểm duyệt")
      expect(page).to have_no_link("Bà Mối")
    end
    expect(page).to have_no_css(".that-space-member-nav")
    expect(page).to have_no_css(".list-controls .nav-pills", visible: true)
    expect(page).to have_no_css(".list-controls .category-breadcrumb", visible: true)
    expect(page).to have_no_css(".welcome-banner", visible: true)
    expect(page).to have_no_css(".alert-emails-disabled", visible: true)
    expect(page).to have_no_css(".sidebar-section[data-section-name='chat-channels']")
    retain_theme_screenshot("that-space-desktop")

    find(".that-space-first-step__action").click
    expect(page).to have_css("#reply-control.open")
    expect(page).to have_css("#reply-control .category-chooser", text: configured_category("introduction").name)
    expect(find("#reply-title").value).to start_with("Xin chào, mình là")
    expect(page).to have_css("#reply-control .composer-actions", text: "Viết bài mới")
    expect(page).to have_no_css("#reply-control", text: "Create topic")
    expect(page).to have_button("Đăng bài")
    retain_theme_screenshot("that-space-first-step-composer")
  end

  it "shows only the feed once the member has posted" do
    create_post(user: member, category: configured_category("introduction"), title: "Xin chào, mình là thành viên mới", raw: "Mình đến đây để kết nối và sáng tạo cùng mọi người.")
    sign_in(member)
    visit "/"

    expect(page).to have_css(".topic-list")
    expect(page).to have_no_css(".that-space-first-step")
  end

  it "keeps staff tools for staff only" do
    sign_in(Fabricate(:admin, refresh_auto_groups: true))
    visit "/"

    within(".sidebar-wrapper") { expect(page).to have_link("Quản trị") }
  end

  def ba_moi_bot!
    bot = Fabricate(:user, username: "ba_moi", refresh_auto_groups: true)
    that_space_theme.update_setting("ba_moi_username", bot.username)
    bot
  end

  def ba_moi_channel(member, bot)
    Chat::CreateDirectMessageChannel.call(guardian: member.guardian, params: { target_usernames: [bot.username], upsert: true }).channel
  end

  # Discourse AI answers a top-level direct-chat message in a forced thread on it.
  def ai_style_reply(channel, bot, to:, raw:)
    ChatSDK::Message.create(raw: raw, channel_id: channel.id, guardian: bot.guardian, in_reply_to_id: to.id, force_thread: true, enforce_membership: false)
  end

  it "opens the member's current Bà Mối conversation thread and keeps new messages in it" do
    bot = ba_moi_bot!
    channel = ba_moi_channel(member, bot)
    opening = ChatSDK::Message.create(raw: "Chào Bà Mối 🌸", channel_id: channel.id, guardian: member.guardian)
    ai_style_reply(channel, bot, to: opening, raw: "Chào bạn 🌸 Bà đây. Bạn đang tìm kiếm điều gì?")
    thread_id = opening.reload.thread_id
    expect(thread_id).to be_present

    sign_in(member)
    visit "/"
    within(".sidebar-wrapper") { click_link("Bà Mối") }
    expect(page).to have_css(".chat-thread", text: "Bà đây")
    expect(page).to have_no_css("#reply-control.open")

    find(".chat-thread .chat-composer__input").fill_in(with: "Mình muốn tìm một mối quan hệ lâu dài")
    find(".chat-thread .chat-composer__input").send_keys(:enter)
    expect(page).to have_css(".chat-thread", text: "mối quan hệ lâu dài")
    expect(Chat::Message.where(chat_channel_id: channel.id, user_id: member.id).last.thread_id).to eq(thread_id)
    expect(Chat::DirectMessageUser.where(user_id: member.id).count).to eq(1)
    retain_theme_screenshot("that-space-ba-moi-chat")
  end

  it "starts the first conversation with a greeting and moves into it when Bà Mối answers" do
    bot = ba_moi_bot!
    sign_in(member)
    visit "/"
    find(".that-space-first-step__ba-moi").click

    expect(page).to have_css(".chat-composer__input")
    greeting = nil
    try_until_success { greeting = Chat::Message.find_by!(user_id: member.id, message: "Chào Bà Mối 🌸") }
    channel = Chat::Channel.find(greeting.chat_channel_id)
    expect(channel.chatable.users).to contain_exactly(member, bot)

    ai_style_reply(channel, bot, to: greeting, raw: "Chào bạn 🌸 Bà rất vui được gặp bạn.")
    expect(page).to have_css(".chat-thread", text: "Bà rất vui")
  end

  it "gives phones the same Bà Mối conversation", mobile: true do
    bot = ba_moi_bot!
    channel = ba_moi_channel(member, bot)
    opening = ChatSDK::Message.create(raw: "Chào Bà Mối 🌸", channel_id: channel.id, guardian: member.guardian)
    ai_style_reply(channel, bot, to: opening, raw: "Chào bạn 🌸 Trước khi bắt đầu, Bà cần bạn đọc và đồng ý vài điều nhé.")
    sign_in(member)
    visit "/"
    find(".that-space-first-step__ba-moi").click

    expect(page).to have_css(".chat-thread", text: "Bà cần bạn đọc")
    expect(page).to have_css(".chat-thread .chat-composer__input", visible: true)
    retain_theme_screenshot("that-space-ba-moi-chat-mobile")
  end

  it "renders an artist's portfolio from the gallery category" do
    artwork = create_post(user: member, category: configured_category("exhibition"), title: "My artwork in Thật Space", raw: "An artwork and a short reflection about its creation.")
    sign_in(member)
    visit "/u/#{member.username}/activity/portfolio"
    expect(page).to have_link(artwork.topic.title)
    expect(page).to have_css(".portfolio-link", text: "Tác phẩm")
  end

  it "gives phones the same single first step at full width", mobile: true do
    sign_in(member)
    visit "/"

    expect(page).to have_css("html.mobile-view")
    expect(page).to have_css(".that-space-first-step", visible: true)
    action_width = page.evaluate_script("document.querySelector('.that-space-first-step__action').getBoundingClientRect().width")
    card_width = page.evaluate_script("document.querySelector('.that-space-first-step').getBoundingClientRect().width")
    expect(action_width).to be > card_width * 0.8
    retain_theme_screenshot("that-space-mobile")
  end
end
