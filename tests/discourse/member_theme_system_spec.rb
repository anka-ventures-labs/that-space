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
      %w[Bảng\ tin Sự\ kiện Triển\ lãm Tin\ nhắn].each { |name| expect(page).to have_link(name) }
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

  def ba_moi_threads_for(user)
    Topic.where(archetype: Archetype.private_message).joins(:topic_allowed_users).where(topic_allowed_users: { user_id: user.id })
  end

  it "opens one ongoing chat with Bà Mối instead of a message editor" do
    bot = Fabricate(:user, username: "ba_moi", refresh_auto_groups: true)
    that_space_theme.update_setting("ba_moi_username", bot.username)
    sign_in(member)
    visit "/"
    expect(page).to have_button("Trò chuyện riêng với Bà Mối")

    within(".sidebar-wrapper") { click_link("Bà Mối") }
    expect(page).to have_css("body.ba-moi-chat")
    expect(page).to have_css(".ba-moi-chat-input textarea")
    expect(page).to have_no_css("#reply-control.open")
    expect(page).to have_css(".topic-post", text: "Chào Bà Mối")
    thread = ba_moi_threads_for(member).sole
    expect(thread.topic_allowed_users.pluck(:user_id)).to contain_exactly(member.id, bot.id)

    create_post(user: bot, topic: thread, raw: "Chào bạn, Bà đây. Bạn đang tìm kiếm điều gì?")
    expect(page).to have_css(".topic-post.ba-moi-post", text: "Bà đây")

    find(".ba-moi-chat-input textarea").set("Mình muốn tìm một mối quan hệ lâu dài")
    find(".ba-moi-chat-input textarea").send_keys(:enter)
    expect(page).to have_css(".topic-post:not(.ba-moi-post)", text: "mối quan hệ lâu dài")
    expect(page).to have_no_css("#topic-footer-buttons", visible: true)
    expect(thread.reload.posts.count).to eq(3)
    retain_theme_screenshot("that-space-ba-moi-chat")

    visit "/"
    within(".sidebar-wrapper") { click_link("Bà Mối") }
    expect(page).to have_current_path(%r{/t/[^/]+/#{thread.id}})
    expect(ba_moi_threads_for(member).count).to eq(1)
  end

  it "gives phones the same chat with Bà Mối", mobile: true do
    bot = Fabricate(:user, username: "ba_moi", refresh_auto_groups: true)
    that_space_theme.update_setting("ba_moi_username", bot.username)
    thread = create_post(user: member, title: "Trò chuyện cùng Bà Mối", raw: "Chào Bà Mối 🌸", archetype: Archetype.private_message, target_usernames: bot.username).topic
    create_post(user: bot, topic: thread, raw: "Chào bạn 🌸 Bà rất vui được gặp bạn. Trước khi bắt đầu, Bà cần bạn đọc và đồng ý vài điều nhé.")
    sign_in(member)
    visit "/t/#{thread.slug}/#{thread.id}"

    expect(page).to have_css("body.ba-moi-chat")
    expect(page).to have_css(".topic-post.ba-moi-post", text: "Bà rất vui")
    expect(page).to have_css(".ba-moi-chat-input textarea", visible: true)
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
