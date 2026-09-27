import { describe, expect, it } from 'vitest'
import { containsContactDetails, findContactDetails } from '@/lib/matching/contact'

describe('contact-detail detection (held before a reveal)', () => {
  it.each([
    ['0901 234 567', 'phone'],
    ['số mình là +84 901 234 567 nhé', 'phone'],
    ['gọi 09.01.23.45.67 nha', 'phone'],
    ['email: lan.nguyen@gmail.com', 'email'],
    ['em at gmail dot com', 'email'],
    ['lan a còng yahoo chấm com', 'email'],
    ['add zalo mình nha', 'handle'],
    ['sđt của mình đây', 'handle'],
    ['fb.com/nguyen.lan.123', 'url'],
    ['https://thatspace.vn/u/realname', 'url'],
    ['không chín không một hai ba bốn năm sáu bảy', 'spelled_digits'],
  ])('holds %j (%s)', (text, finding) => {
    expect(findContactDetails(text)).toContain(finding)
  })

  it.each([
    'Chào chị, hôm nay trời Hà Nội đẹp quá!',
    'Mình thích đọc sách và đi bộ buổi sáng, còn chị?',
    'Năm nay mình 30 tuổi, làm giáo viên được 5 năm rồi.',
    'Hẹn gặp chị lúc 7 giờ tối thứ Bảy nhé',
    'Mình muốn kết bạn với chị',
  ])('lets normal chat through: %j', (text) => {
    expect(containsContactDetails(text)).toBe(false)
  })
})
