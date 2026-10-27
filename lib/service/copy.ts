/**
 * Every Vietnamese sentence the service writes itself, in one place for Thảo
 * to review. The persona writes the conversation; these are the notices the
 * service posts (Bà Mối's notifications and Thư Duyên's relay notices) and the
 * fallback messages that accompany errors.
 */

export const ERROR_MESSAGES = {
  service_disabled: 'Bà Mối đang tạm thời không khả dụng. Bạn thử lại sau nhé.',
  unauthorized: 'Bà Mối chưa xác thực được yêu cầu này.',
  not_found_tool: 'Bà Mối không có chức năng này.',
  invalid_request: 'Yêu cầu gửi lên chưa đúng định dạng.',
  invalid_args: 'Thông tin gửi lên chưa đúng định dạng, Bà hỏi lại nhé.',
  internal: 'Bà Mối đang gặp chút trục trặc. Bạn thử lại sau ít phút nhé.',
  consent_required: 'Bạn cần đồng ý tham gia Bà Mối trước đã.',
  paused: 'Bạn đang tạm dừng Bà Mối. Khi muốn quay lại, bạn nói "tiếp tục" nhé.',
  profile_incomplete: 'Hồ sơ của bạn còn thiếu vài thông tin.',
  card_unconfirmed: 'Bạn cần xác nhận thẻ ẩn danh trước đã.',
  under_18: 'Bà Mối chỉ dành cho người từ 18 tuổi trở lên.',
  invalid_birth_date: 'Ngày sinh này chưa hợp lệ.',
  age_range_invalid: 'Khoảng tuổi này chưa hợp lệ.',
  summary_leaks: 'Đoạn giới thiệu còn thông tin có thể làm lộ danh tính.',
  not_found: 'Bà Mối không tìm thấy mục này.',
  stale: 'Thông tin về người này đã thay đổi, Bà không gửi tín hiệu được nữa.',
  gone: 'Người này hiện không còn trong hộp Duyên.',
  daily_limit: 'Hôm nay bạn đã dùng hết lượt này. Mai quay lại nhé.',
  expired: 'Tín hiệu này đã hết hạn.',
  already_answered: 'Tín hiệu này đã được trả lời rồi.',
  closed: 'Cuộc trò chuyện này đã đóng.',
  confirm_required: 'Việc này cần bạn xác nhận rõ ràng.',
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES

// ── Consent (versioned; status returns the text for the persona to show) ─────

export const CONSENT_VERSION = 'beta-2026-09-27'

export const CONSENT_TEXT = [
  'Trước khi bắt đầu, Bà cần bạn đồng ý mấy điều:',
  '1. Bà Mối chỉ dành cho người từ 18 tuổi trở lên.',
  '2. Những gì bạn kể, Bà giữ riêng. Người khác chỉ thấy một thẻ ẩn danh: khoảng tuổi, sở thích, mệnh và vài dòng giới thiệu, không có tên, ngày sinh hay nơi ở cụ thể.',
  '3. Đây là bản thử nghiệm: quản trị viên của Thật Space có thể đọc tin nhắn giữa bạn với Bà Mối và các cuộc trò chuyện ẩn danh.',
  '4. Bạn có thể tạm dừng hoặc xoá dữ liệu mai mối bất cứ lúc nào, chỉ cần nói với Bà. Xoá dữ liệu không xoá các tin nhắn đã có trên diễn đàn.',
  'Bạn có đồng ý tham gia không?',
].join('\n')

/** Expected conversation branch, not an operational error. */
export const ADULT_CONFIRMATION_PROMPT =
  'Bạn xác nhận mình từ 18 tuổi trở lên, đúng không?'

export const ADULT_INELIGIBLE_MESSAGE =
  'Bà Mối chỉ dành cho người từ 18 tuổi trở lên.'

// ── Bà Mối, in the member's own thread with her ─────────────────────────────

export const SIGNAL_RECEIVED =
  '🌸 Có người vừa gửi tín hiệu muốn làm quen với bạn qua Bà Mối. Khi nào rảnh, bạn nhắn "xem tín hiệu" để Bà kể cho nghe nhé. Tín hiệu sẽ chờ bạn trong 7 ngày.'

export const SIGNAL_CLOSED = 'Bà Mối báo tin: lần này chưa có duyên. Đừng buồn nhé, hộp Duyên ngày mai vẫn chờ bạn.'

export const PERSONA_THREAD_TITLE = 'Bà Mối có tin cho bạn'

export function matchOpened(alias: string): string {
  return `💞 Tin vui! Bạn và ${alias} đã cùng gật đầu. Thư Duyên vừa mở một phòng trò chuyện ẩn danh cho hai người, bạn xem trong tin nhắn riêng nhé.`
}

// ── Thư Duyên, in the relay threads ─────────────────────────────────────────

export function relayTitle(alias: string): string {
  return `Trò chuyện ẩn danh với ${alias}`
}

export function relayIntro(alias: string): string {
  return [
    `Chào bạn, mình là Thư Duyên, người chuyển thư ẩn danh của Bà Mối. Đây là phòng trò chuyện giữa bạn và **${alias}**: mỗi tin bạn viết ở đây, mình sẽ chuyển sang cho ${alias} và ngược lại.`,
    '',
    '- Mình chỉ chuyển chữ, tối đa 1.200 ký tự mỗi tin.',
    '- Trước khi hai bạn cùng đồng ý lộ diện, mình giữ lại tin có số điện thoại, email, mạng xã hội, đường link hoặc tệp đính kèm.',
    '- Sửa hay xoá tin sau khi gửi sẽ không cập nhật được ở bên kia.',
    '- Trong giai đoạn thử nghiệm, quản trị viên có thể đọc các cuộc trò chuyện.',
    '',
    'Muốn lộ diện, kết thúc hay chặn, bạn nhắn với Bà Mối nhé.',
  ].join('\n')
}

export function relayedMessage(alias: string, text: string): string {
  return `**${alias}:**\n\n${text}`
}

export const HELD_CONTACT =
  'Thư Duyên giữ lại tin vừa rồi vì có số điện thoại, email, mạng xã hội hoặc đường link. Trước khi hai bạn cùng lộ diện, mình chỉ chuyển lời. Muốn lộ diện, bạn nhắn Bà Mối nhé.'

export const HELD_ATTACHMENT = 'Thư Duyên chỉ chuyển được chữ, nên tin có ảnh hoặc tệp đính kèm chưa được gửi đi.'

export const TOO_LONG = 'Tin vừa rồi dài quá 1.200 ký tự nên chưa được gửi. Bạn chia nhỏ ra giúp mình nhé.'

export const RATE_LIMITED = 'Bạn đang nhắn hơi nhanh. Đợi một chút rồi gửi tiếp nhé.'

export function revealAsked(alias: string): string {
  return `${alias} muốn lộ diện với bạn. Nếu bạn cũng muốn, hãy nói với Bà Mối nhé.`
}

export function revealed(alias: string, username: string, profileUrl: string): string {
  return `🌷 Hai bạn đã cùng đồng ý lộ diện. ${alias} là [${username}](${profileUrl}). Từ giờ mình chuyển cả số điện thoại và đường link, nhưng vẫn chỉ chuyển chữ.`
}

export const MATCH_ENDED = 'Cuộc trò chuyện này đã kết thúc. Cảm ơn hai bạn đã cho nhau một cơ hội.'

export const BLOCK_CONFIRMED = 'Bạn đã chặn người này. Cuộc trò chuyện đã đóng và hai người sẽ không được giới thiệu lại với nhau.'
