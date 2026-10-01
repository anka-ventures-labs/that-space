# frozen_string_literal: true

require_relative "spec_helper"
require ThatSpaceCommunitySpecSupport::REPO_ROOT.join("discourse/presentation/bootstrap.rb").to_s

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

  it "compiles the local theme and renders member navigation on a real Discourse page" do
    sign_in(member)
    visit "/latest"

    expect(that_space_theme).to be_persisted
    expect(page).to have_css(".that-space-member-nav", visible: true)
    expect(page).to have_css(".that-space-member-nav__brand", text: "Thật Space")
    expect(page).to have_css(".that-space-member-nav a[href='#{configured_category("exhibition").url}']", text: "Triển lãm")
    expect(page).to have_css(".that-space-member-nav a[href='/upcoming-events']", text: "Retreat & Workshop")
    expect(page).to have_css(".that-space-member-welcome", visible: true)
    expect(page).to have_link("Xem Triển lãm", href: configured_category("exhibition").url)
    expect(page).to have_link("Xem lịch gặp gỡ", href: "/upcoming-events")
  end

  it "keeps member navigation and content outside the guest session" do
    visit "/latest"
    expect(page).not_to have_css(".that-space-member-nav")
    expect(page).not_to have_css(".that-space-member-welcome")
    expect(page).to have_css(".login-welcome, .login-modal, .login-required, .login-page")
  end

  it "opens a private-message composer addressed to the configured Bà Mối account" do
    bot = Fabricate(:user, username: "ba_moi", refresh_auto_groups: true)
    that_space_theme.update_setting("ba_moi_username", bot.username)
    sign_in(member)
    visit "/latest"
    expect(page).to have_button("Nhắn Bà Mối")
    find(".that-space-member-nav__ba-moi").click
    expect(page).to have_css("#reply-control.open")
    expect(page).to have_css(".composer-fields .selected-name, .composer-fields .selected-content", text: bot.username)
  end

  it "renders an artist's portfolio from the gallery category" do
    artwork = create_post(user: member, category: configured_category("exhibition"), title: "My artwork in Thật Space", raw: "An artwork and a short reflection about its creation.")
    sign_in(member)
    visit "/u/#{member.username}/activity/portfolio"
    expect(page).to have_link(artwork.topic.title)
    expect(page).to have_css(".portfolio-link", text: "Tác phẩm")
  end

  it "uses the imported theme's mobile member layout", mobile: true do
    sign_in(member)
    visit "/latest"

    expect(page).to have_css("html.mobile-view")
    expect(page).to have_css(".that-space-member-nav", visible: true)
    expect(
      page.evaluate_script("getComputedStyle(document.querySelector('.that-space-member-nav')).flexWrap"),
    ).to eq("wrap")
    expect(
      page.evaluate_script("getComputedStyle(document.querySelector('.that-space-member-welcome')).display"),
    ).to eq("block")
  end
end
