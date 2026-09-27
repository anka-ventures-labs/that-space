/**
 * Sample members that fill the demo pool so a beta member's first box isn't
 * empty. Every one is labelled (members.is_sample and card.isSample) so Bà Mối
 * always says it's a sample profile. Samples have no Discourse account, so
 * they never answer signals. Reseeding replaces them all.
 */
import type { Db } from './db'
import { EMPTY_PROFILE, deleteSampleMembers, insertSampleMember, poolBuckets, saveCard, saveProfile, type ProfileDraft } from './repo'
import { dayMasterLabel } from '@/lib/matching/bazi'
import { deriveProfile } from '@/lib/matching/derive'
import { buildPoolCard, checkTextForLeaks, initialOf } from '@/lib/matching/privacy'
import type { Children, Gender, Intent, MaritalStatus, Seeking, WantsChildren } from '@/lib/matching/types'

type Row = [
  name: string, gender: Gender, seeking: Seeking, intent: Intent, birthDate: string, birthTime: string | null,
  city: string, ageMin: number, ageMax: number, marital: MaritalStatus, children: Children,
  wantsChildren: WantsChildren, hobbies: string[], openAnswer: string, occupation: string, summary: string,
]

// Summaries describe temperament and hobbies only: never a name, city, job or date.
const ROWS: Row[] = [
  ['Lan', 'female', 'female', 'friendship', '1991-03-14', null, 'Hà Nội', 25, 45, 'single', 'none', 'unsure',
    ['vẽ tranh', 'thiền', 'trà đạo'], 'Mình muốn có bạn cùng đi triển lãm và ngồi thiền cuối tuần.', 'Kiến trúc sư',
    'Mê màu nước và những buổi trà chiều yên tĩnh. Đang tìm một người bạn cùng đi triển lãm, cùng ngồi thiền mỗi sáng Chủ nhật.'],
  ['Hương', 'female', 'female', 'friendship', '1986-11-02', '06:15', 'TP Hồ Chí Minh', 30, 50, 'divorced', 'yes_live_with', 'no',
    ['yoga', 'nấu ăn', 'đọc sách'], 'Sau nhiều biến động, mình muốn có bạn để cùng nhau chữa lành.', 'Kế toán',
    'Một người mẹ đơn thân dịu dàng, sáng nào cũng tập yoga. Thích nấu cho bạn bè những bữa cơm nhà và trò chuyện thật lâu.'],
  ['Ngọc', 'female', 'female', 'friendship', '1995-07-21', null, 'Đà Nẵng', 22, 40, 'single', 'none', 'yes',
    ['chạy bộ', 'biển', 'nhiếp ảnh'], 'Mình mới chuyển nhà, cần bạn chạy bộ buổi sáng.', 'Thiết kế đồ họa',
    'Vừa chuyển về sống gần biển, sáng nào cũng chạy bộ và chụp ảnh bình minh. Muốn có vài người bạn mới ở nơi ở mới.'],
  ['Mai', 'female', 'female', 'friendship', '1979-02-10', null, 'Hà Nội', 35, 60, 'widowed', 'yes_not_live_with', 'no',
    ['làm vườn', 'cắm hoa', 'thiện nguyện'], 'Con đã lớn, mình muốn có thêm những người bạn để đi đây đi đó.', 'Giáo viên',
    'Yêu cây cỏ, ban công lúc nào cũng đầy hoa. Các con đã lớn và đi xa, giờ muốn có bạn đồng hành cho những chuyến đi và việc thiện nguyện.'],
  ['Nhung', 'female', 'female', 'friendship', '1993-09-05', '21:40', 'TP Hồ Chí Minh', 25, 40, 'single', 'none', 'unsure',
    ['tarot', 'tử vi', 'cà phê'], 'Tìm bạn nói chuyện về tâm linh mà không bị phán xét.', 'Chuyên viên nhân sự',
    'Mê tarot và tử vi, thích những cuộc trò chuyện sâu bên ly cà phê. Mong gặp một người bạn cởi mở với chuyện tâm linh.'],
  ['Trang', 'female', 'female', 'friendship', '1984-12-12', null, 'Hải Phòng', 30, 50, 'married', 'yes_live_with', 'no',
    ['làm bánh', 'thêu', 'phim nghệ thuật'], 'Mình cần một góc riêng ngoài gia đình, một người bạn thật sự.', 'Chủ tiệm bánh',
    'Đã có gia đình, làm bánh và thêu tay để thở chậm lại. Muốn một người bạn thật sự ngoài những bổn phận hằng ngày.'],
  ['Vy', 'female', 'female', 'friendship', '1999-04-18', null, 'Cần Thơ', 20, 35, 'single', 'none', 'yes',
    ['hát', 'guitar', 'du lịch bụi'], 'Mình thích đi đây đi đó, cần bạn đồng hành.', 'Sinh viên cao học',
    'Hát và chơi guitar, cứ có dịp là xách ba lô lên đường. Tìm bạn đồng hành cho những chuyến đi bụi miền Tây.'],
  ['Hà', 'female', 'female', 'friendship', '1989-08-30', null, 'Huế', 28, 48, 'single', 'none', 'unsure',
    ['gốm', 'viết lách', 'thiền'], 'Mình viết nhật ký mỗi ngày, muốn có bạn cùng đọc và cùng viết.', 'Biên tập viên',
    'Nặn gốm, viết nhật ký mỗi ngày và yêu sự tĩnh lặng. Muốn một người bạn để cùng đọc, cùng viết và cùng im lặng.'],
  ['Phương', 'female', 'female', 'friendship', '1975-06-01', '05:30', 'TP Hồ Chí Minh', 40, 65, 'divorced', 'yes_not_live_with', 'no',
    ['khiêu vũ', 'bơi', 'thiện nguyện'], 'Tuổi này mình muốn sống vui, có bạn cùng đi nhảy.', 'Doanh nhân',
    'Năng động, tuần nào cũng đi khiêu vũ và bơi. Đang sống một chương mới thật vui và muốn có bạn cùng tận hưởng.'],
  ['Nhi', 'female', 'female', 'friendship', '1997-01-25', null, 'Hà Nội', 22, 38, 'single', 'none', 'yes',
    ['vẽ tranh', 'đọc sách', 'mèo'], 'Mình hướng nội, muốn có bạn hiểu những ngày cần yên tĩnh.', 'Họa sĩ minh họa',
    'Vẽ mỗi ngày và sống cùng hai chú mèo. Hướng nội, thích những buổi hẹn nhỏ ở hiệu sách hơn là chỗ đông người.'],
  ['Linh', 'female', 'male', 'long_term', '1990-10-10', null, 'Hà Nội', 30, 42, 'single', 'none', 'yes',
    ['đọc sách', 'leo núi', 'nấu ăn'], 'Mình muốn một mối quan hệ nghiêm túc, bình yên.', 'Bác sĩ',
    'Công việc bận rộn nhưng cuối tuần luôn dành cho leo núi và những món nấu thật chậm. Tìm một người điềm đạm cho một mối quan hệ lâu dài.'],
  ['Thu', 'female', 'male', 'marriage', '1988-05-19', '08:00', 'TP Hồ Chí Minh', 33, 45, 'single', 'none', 'yes',
    ['yoga', 'du lịch', 'làm bánh'], 'Mình sẵn sàng cho hôn nhân và muốn có con.', 'Quản lý dự án',
    'Chín chắn, tập yoga mỗi ngày và mê làm bánh. Đã sẵn sàng xây dựng gia đình với một người tử tế, muốn có con.'],
  ['Yến', 'female', 'male', 'long_term', '1983-03-03', null, 'Đà Nẵng', 38, 52, 'divorced', 'yes_live_with', 'unsure',
    ['trà đạo', 'nhiếp ảnh', 'biển'], 'Mình có một bé gái, mong người sau này thương cả hai mẹ con.', 'Chủ homestay',
    'Mẹ của một bé gái, sống gần biển và mê trà. Mong một người đàn ông ấm áp, thương được cả hai mẹ con.'],
  ['Nga', 'female', 'male', 'marriage', '1992-12-24', null, 'Hà Nội', 30, 40, 'single', 'none', 'yes',
    ['piano', 'nấu ăn', 'thiền'], 'Mình tin vào duyên, muốn một người cùng xây tổ ấm.', 'Giảng viên âm nhạc',
    'Chơi piano, tin vào duyên và những điều giản dị. Muốn cùng một người xây tổ ấm có tiếng đàn và mùi cơm nhà.'],
  ['Kim', 'female', 'male', 'casual', '1996-08-08', null, 'TP Hồ Chí Minh', 26, 38, 'single', 'none', 'unsure',
    ['khiêu vũ', 'cà phê', 'phim nghệ thuật'], 'Mình chưa muốn ràng buộc, chỉ muốn gặp gỡ vui vẻ.', 'Marketing',
    'Vui tính, mê nhảy salsa và phim nghệ thuật. Hiện chưa muốn ràng buộc, chỉ muốn những buổi gặp gỡ nhẹ nhàng và thú vị.'],
  ['Xuân', 'female', 'male', 'long_term', '1978-01-15', '19:20', 'Hải Phòng', 42, 58, 'divorced', 'yes_not_live_with', 'no',
    ['làm vườn', 'câu cá', 'đọc sách'], 'Mình muốn một người bạn đời để cùng già đi thong thả.', 'Dược sĩ',
    'Hiền hậu, thích làm vườn và đọc sách. Các con đã trưởng thành, mong một người bạn đời để cùng già đi thật thong thả.'],
  ['Chi', 'female', 'female', 'long_term', '1994-06-06', null, 'TP Hồ Chí Minh', 25, 40, 'single', 'none', 'unsure',
    ['leo núi', 'vẽ tranh', 'chạy bộ'], 'Mình muốn một mối quan hệ nghiêm túc với một người con gái.', 'Kỹ sư phần mềm',
    'Mê leo núi và vẽ phong cảnh. Tìm một cô gái cho mối quan hệ nghiêm túc, cùng nhau khám phá thế giới.'],
  ['Uyên', 'female', 'female', 'long_term', '1990-02-28', null, 'Hà Nội', 28, 42, 'single', 'none', 'yes',
    ['đọc sách', 'gốm', 'trà đạo'], 'Mình mong một mối quan hệ dịu dàng, lâu dài.', 'Nhà nghiên cứu',
    'Trầm tĩnh, mê gốm và những cuốn sách dày. Mong gặp một người con gái cho một mối quan hệ dịu dàng và bền lâu.'],
  ['Oanh', 'female', 'both', 'friendship', '1985-10-20', null, 'Huế', 30, 55, 'single', 'none', 'no',
    ['thiền', 'tử vi', 'thiện nguyện'], 'Mình muốn kết nối với những người cùng quan tâm tâm linh.', 'Hướng dẫn viên thiền',
    'Thiền mỗi ngày, quan tâm đến tâm linh và việc thiện. Mở lòng kết bạn với mọi người có cùng tần số.'],
  ['Bích', 'female', 'both', 'casual', '1998-11-11', null, 'Đà Nẵng', 22, 35, 'single', 'none', 'unsure',
    ['lướt sóng', 'khiêu vũ', 'nhiếp ảnh'], 'Mình thích những cuộc gặp tự nhiên, không áp lực.', 'Nhiếp ảnh gia tự do',
    'Luôn mang theo máy ảnh, mê lướt sóng và nhảy. Thích những cuộc gặp tự nhiên, không áp lực, để duyên đưa đến đâu thì đến.'],
  ['Nam', 'male', 'female', 'long_term', '1987-04-04', '07:45', 'Hà Nội', 28, 40, 'single', 'none', 'yes',
    ['leo núi', 'nấu ăn', 'đọc sách'], 'Mình muốn một mối quan hệ nghiêm túc, tôn trọng lẫn nhau.', 'Kỹ sư xây dựng',
    'Điềm đạm, cuối tuần leo núi và nấu ăn cho bạn bè. Tìm một mối quan hệ nghiêm túc, tôn trọng và lắng nghe nhau.'],
  ['Tuấn', 'male', 'female', 'marriage', '1985-09-09', null, 'TP Hồ Chí Minh', 30, 42, 'single', 'none', 'yes',
    ['chạy bộ', 'cà phê', 'du lịch'], 'Mình đã sẵn sàng cho hôn nhân.', 'Kiến trúc sư',
    'Chạy bộ mỗi sáng, mê cà phê và những chuyến đi xa. Đã sẵn sàng cho hôn nhân và một gia đình nhỏ ấm áp.'],
  ['Hoàng', 'male', 'female', 'long_term', '1982-02-14', null, 'Đà Nẵng', 32, 45, 'divorced', 'yes_not_live_with', 'unsure',
    ['câu cá', 'guitar', 'biển'], 'Mình học được nhiều từ cuộc hôn nhân trước, muốn bắt đầu chín chắn hơn.', 'Kỹ sư điện',
    'Từng đi qua một cuộc hôn nhân và học được nhiều điều. Thích biển, câu cá và đàn guitar, muốn bắt đầu lại thật chín chắn.'],
  ['Khoa', 'male', 'female', 'casual', '1995-05-05', null, 'TP Hồ Chí Minh', 23, 35, 'single', 'none', 'unsure',
    ['khiêu vũ', 'nhiếp ảnh', 'phim nghệ thuật'], 'Mình muốn gặp gỡ vui vẻ trước đã.', 'Nhà làm phim',
    'Mê điện ảnh, thích nhảy và chụp ảnh đường phố. Muốn những buổi gặp gỡ vui vẻ, không vội vàng.'],
  ['Minh', 'male', 'female', 'marriage', '1980-07-07', '22:10', 'Hà Nội', 35, 48, 'widowed', 'yes_live_with', 'no',
    ['làm vườn', 'thiền', 'nấu ăn'], 'Mình mong một người cùng chăm lo tổ ấm.', 'Bác sĩ đông y',
    'Hiền lành, trồng rau và nấu ăn cho con mỗi ngày. Mong tìm một người phụ nữ cùng chăm lo một tổ ấm bình yên.'],
  ['Sơn', 'male', 'both', 'friendship', '1991-12-01', null, 'Cần Thơ', 25, 45, 'single', 'none', 'unsure',
    ['du lịch bụi', 'hát', 'thiện nguyện'], 'Mình thích kết bạn và đi tình nguyện.', 'Kỹ sư nông nghiệp',
    'Thích đi tình nguyện ở các vùng quê và hát cho bọn trẻ nghe. Mở lòng kết bạn với mọi người.'],
  ['Đức', 'male', 'female', 'long_term', '1989-03-30', null, 'Huế', 28, 40, 'single', 'none', 'yes',
    ['đọc sách', 'viết lách', 'trà đạo'], 'Mình trầm tính, mong một người để cùng trò chuyện mỗi tối.', 'Giáo viên văn',
    'Yêu văn chương, thích trà và những cuộc trò chuyện dài. Trầm tính nhưng ấm áp, mong một mối quan hệ lâu dài.'],
  ['Phong', 'male', 'female', 'marriage', '1984-10-26', null, 'Hải Phòng', 30, 42, 'single', 'none', 'yes',
    ['bơi', 'nấu ăn', 'du lịch'], 'Mình muốn lập gia đình trong năm tới.', 'Thuyền trưởng',
    'Nhiều năm xa nhà vì công việc, giờ muốn dừng chân và lập gia đình. Nấu ăn giỏi, thích bơi và những chuyến đi.'],
  ['An', 'other', 'both', 'friendship', '1996-03-21', null, 'TP Hồ Chí Minh', 22, 40, 'single', 'none', 'unsure',
    ['vẽ tranh', 'thiền', 'tarot'], 'Mình muốn kết nối với những người cởi mở.', 'Nghệ sĩ thị giác',
    'Vẽ, đọc tarot và sống chậm. Tìm những kết nối cởi mở, nơi mỗi người được là chính mình.'],
  ['Bảo', 'other', 'both', 'long_term', '1993-08-15', null, 'Hà Nội', 25, 40, 'single', 'none', 'unsure',
    ['piano', 'đọc sách', 'leo núi'], 'Mình mong một mối quan hệ nghiêm túc với người hiểu mình.', 'Lập trình viên',
    'Chơi piano và mê leo núi. Mong một mối quan hệ nghiêm túc với người hiểu và tôn trọng mình.'],
]

export interface SampleMember {
  name: string
  occupation: string
  summary: string
  profile: ProfileDraft
}

export const SAMPLE_MEMBERS: SampleMember[] = ROWS.map(([
  name, gender, seeking, intent, birthDate, birthTime, city, ageMin, ageMax, marital, children, wantsChildren,
  hobbies, openAnswer, occupation, summary,
]) => ({
  name,
  occupation,
  summary,
  profile: {
    ...EMPTY_PROFILE, gender, seeking, intent, birthDate, birthTime, city, ageMin, ageMax, marital, children,
    wantsChildren, hobbies, openAnswer, occupation,
  },
}))

const bump = (counts: Map<string, number>, key: string | null) => {
  if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
}

/** Replaces all sample members with SAMPLE_MEMBERS, with confirmed, discoverable cards. */
export async function seedSampleMembers(db: Db, at: Date = new Date()): Promise<{ removed: number; inserted: number }> {
  return db.transaction(async (tx) => {
    const removed = await deleteSampleMembers(tx)
    const prepared = SAMPLE_MEMBERS.map((sample) => ({ sample, derived: deriveProfile(sample.profile) }))

    // Rule of 5 over the pool the samples are joining.
    const { regions, initials } = await poolBuckets(tx)
    for (const { sample, derived } of prepared) {
      bump(regions, derived.region)
      bump(initials, initialOf(sample.name))
    }

    for (const { sample, derived } of prepared) {
      const { profile } = sample
      const leaks = checkTextForLeaks(sample.summary, [sample.name, profile.city, sample.occupation])
      if (!leaks.ok) throw new Error(`Sample summary for ${sample.name} leaks: ${leaks.violations.join(', ')}`)

      const member = await insertSampleMember(tx, sample.name, at)
      await saveProfile(tx, member.id, profile, derived)
      const card = buildPoolCard({
        profile: {
          birthDate: profile.birthDate!, city: profile.city, gender: profile.gender!, seeking: profile.seeking!,
          intent: profile.intent!, hobbies: profile.hobbies,
        },
        element: derived.napAmElement,
        dayMaster: dayMasterLabel({ stem: derived.dayStem!, branch: derived.dayBranch!, element: derived.dayElement! }),
        displayName: sample.name,
        regionBucketSize: derived.region ? regions.get(derived.region) ?? 0 : 0,
        initialBucketSize: initials.get(initialOf(sample.name) ?? '') ?? 0,
        summary: sample.summary,
        isSample: true,
        at,
      })
      await saveCard(tx, member.id, card, sample.summary, at)
    }
    return { removed, inserted: prepared.length }
  })
}
