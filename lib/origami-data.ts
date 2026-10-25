export type ForumCategory = "Introductions" | "Life & Growth" | "Relationships" | "Spirituality";

export type ForumReply = {
  author: string;
  time: string;
  body: string;
};

export type ForumThread = {
  slug: string;
  title: string;
  author: string;
  time: string;
  replies: number;
  category: ForumCategory;
  body: string;
  sampleReplies: ForumReply[];
};

const sharedReplies: ForumReply[] = [
  {
    author: "Nguyễn Thị Mai",
    time: "23 giờ trước",
    body: "Mình hoàn toàn hiểu cảm giác này. Nhiều khi sự kết nối bề mặt không đủ để lấp đầy cái cô đơn sâu bên trong. Bạn không hề một mình đâu.",
  },
  {
    author: "Phan Thị Lan",
    time: "20 giờ trước",
    body: "Cảm ơn bạn đã dũng cảm chia sẻ. Mình nhận ra rằng mình cần những cuộc trò chuyện chiều sâu hơn là những buổi tụ tập đông người.",
  },
  {
    author: "Võ Thanh Thảo",
    time: "15 giờ trước",
    body: "Đôi khi chúng ta cần một không gian để nhìn vào bên trong, và Thật Space chính là nơi tốt để làm điều đó.",
  },
  {
    author: "Bùi Minh Hạnh",
    time: "10 giờ trước",
    body: "Thread này chạm đến lòng mình quá. Biết được nhiều người cùng cảm nhận khiến mình thấy bớt cô đơn hơn một chút rồi.",
  },
];

export const forumThreads: ForumThread[] = [
  {
    slug: "gioi-thieu-ban-than",
    title: "Mình mới gia nhập Thật Space — xin chào mọi người!",
    author: "Nguyễn Thị Mai",
    time: "2 giờ trước",
    replies: 24,
    category: "Introductions",
    body: "Chào mọi người! Mình tìm đến Thật Space vì muốn có một không gian an toàn để chia sẻ những suy nghĩ thật lòng và gặp những người cùng tần số.",
    sampleReplies: [],
  },
  {
    slug: "hanh-trinh-yoga-cua-minh",
    title: "Chia sẻ về hành trình yoga của mình sau 6 tháng kiên trì",
    author: "Lê Phương Linh",
    time: "5 giờ trước",
    replies: 35,
    category: "Life & Growth",
    body: "Sáu tháng trước mình bắt đầu tập yoga chỉ vì muốn giảm đau lưng. Giờ đây nó đã trở thành một phần không thể thiếu trong cuộc sống hằng ngày.",
    sampleReplies: [],
  },
  {
    slug: "co-don-trong-dam-dong",
    title: "Có ai cũng cảm thấy cô đơn trong đám đông không?",
    author: "Trần Minh Châu",
    time: "1 ngày trước",
    replies: 63,
    category: "Relationships",
    body: "Mình có rất nhiều bạn bè, luôn được mời đến các buổi tụ tập, nhưng thỉnh thoảng mình vẫn cảm thấy rất cô đơn dù đang ngồi giữa mọi người. Cảm giác này thật kỳ lạ và khó diễn đạt — như kiểu bạn ở đó nhưng không thực sự hiện diện. Mình không chắc đây là vấn đề của mình hay đây là điều mà nhiều người cảm nhận nhưng không dám nói. Mình muốn hỏi mọi người ở đây để hiểu hơn về bản thân mình.",
    sampleReplies: sharedReplies,
  },
  {
    slug: "thien-dinh-buoi-sang",
    title: "Thực hành thiền định buổi sáng đã thay đổi cuộc sống mình",
    author: "Phạm Hương Giang",
    time: "2 ngày trước",
    replies: 41,
    category: "Spirituality",
    body: "Chỉ cần 10–20 phút ngồi yên lặng và quan sát hơi thở, mình nhận ra tâm trí ít bị kéo đi bởi lo lắng và phán xét hơn rất nhiều.",
    sampleReplies: [],
  },
  {
    slug: "vuot-qua-chia-tay",
    title: "Làm thế nào để vượt qua chia tay khi yêu nhau 3 năm?",
    author: "Võ Thanh Thảo",
    time: "3 ngày trước",
    replies: 78,
    category: "Relationships",
    body: "Mình vừa chia tay sau ba năm gắn bó và thật lòng chưa biết phải bắt đầu lại từ đâu. Mình rất cần lời khuyên và sự chia sẻ.",
    sampleReplies: [],
  },
  {
    slug: "ket-ban-tuoi-30",
    title: "Kết bạn mới tuổi 30 có khó không? Trải nghiệm của mình",
    author: "Đỗ Kiều Trang",
    time: "4 ngày trước",
    replies: 52,
    category: "Life & Growth",
    body: "Sau khi chuyển đến thành phố mới, mình học cách làm quen qua những sở thích thật sự và tìm được những tình bạn sâu sắc.",
    sampleReplies: [],
  },
  {
    slug: "phong-thuy-nha-o",
    title: "Phong thủy cho phòng ngủ — thu hút năng lượng tốt cho năm mới",
    author: "Bùi Minh Hạnh",
    time: "5 ngày trước",
    replies: 29,
    category: "Spirituality",
    body: "Mình vừa sắp xếp lại phòng ngủ theo nguyên tắc phong thủy và thấy sự khác biệt rõ rệt chỉ sau vài tuần.",
    sampleReplies: [],
  },
  {
    slug: "yeu-ban-than",
    title: "Self-love trong văn hoá Việt Nam — câu chuyện của mình",
    author: "Huỳnh Ngọc Trân",
    time: "1 tuần trước",
    replies: 94,
    category: "Life & Growth",
    body: "Mình mất gần 30 năm để nhận ra đặt bản thân lên trước không phải là ích kỷ. Đây là hành trình xứng đáng nhất mình từng thực hiện.",
    sampleReplies: [],
  },
  {
    slug: "nuoi-con-mot-minh",
    title: "Những người mẹ đơn thân ở đây — chúng ta cùng chia sẻ nhé",
    author: "Phan Thị Lan",
    time: "1 tuần trước",
    replies: 112,
    category: "Relationships",
    body: "Mình mong đây là nơi những người mẹ đơn thân có thể chia sẻ thật lòng và nâng đỡ nhau.",
    sampleReplies: [],
  },
  {
    slug: "tu-vi-giap-thin",
    title: "Tử Vi năm Giáp Thìn — chia sẻ trải nghiệm của các bạn",
    author: "Nguyễn Bảo Anh",
    time: "2 tuần trước",
    replies: 47,
    category: "Spirituality",
    body: "Mình muốn nghe trải nghiệm thực tế của mọi người khi nhìn lại những chuyển động trong lá số năm vừa qua.",
    sampleReplies: [],
  },
];

export const matchmakingProfiles = [
  ["Trần Minh Châu", "MC", "Aries", "Yêu thiên nhiên, thiền định và sách triết học. Tìm kiếm kết nối tâm hồn chân thành qua những buổi trò chuyện sâu.", 92, [["Love", 5], ["Communication", 5], ["Spirituality", 4]], "Hồ sơ minh hoạ của Châu thể hiện sự táo bạo, chiều sâu và mong muốn xây dựng một kết nối bền vững."],
  ["Lê Phương Linh", "PL", "Gemini", "Writer, dreamer, người đi tìm vẻ đẹp trong từng khoảnh khắc nhỏ. Thích poetry và những buổi sáng bình yên.", 78, [["Love", 4], ["Communication", 5], ["Spirituality", 3]], "Hồ sơ minh hoạ của Linh nhấn mạnh sự sáng tạo, đối thoại và một kết nối nở dần theo thời gian."],
  ["Võ Thanh Thảo", "TT", "Taurus", "Bếp núc, vườn cây và âm nhạc dân gian là thế giới của mình. Tin vào sức mạnh của sự kiên nhẫn.", 85, [["Love", 4], ["Communication", 4], ["Spirituality", 5]], "Hồ sơ minh hoạ của Thảo xoay quanh tính chân thật, ổn định và vẻ đẹp của đời sống giản dị."],
  ["Nguyễn Bảo Anh", "BA", "Libra", "Luật sư ban ngày, nghệ sĩ ban đêm. Tin rằng cuộc sống đẹp nhất khi lý trí và cảm xúc cân bằng.", 87, [["Love", 4], ["Communication", 5], ["Spirituality", 4]], "Libra and you create balance, mutual growth, and shared inspiration."],
  ["Đỗ Kiều Trang", "KT", "Scorpio", "Bác sĩ tâm lý với tấm lòng nhân hậu. Tìm kiếm những người không sợ nhìn thẳng vào cảm xúc.", 74, [["Love", 4], ["Communication", 3], ["Spirituality", 5]], "Hồ sơ minh hoạ của Trang đề cao chiều sâu tinh thần, lòng can đảm và sự chân thật."],
  ["Huỳnh Ngọc Trân", "NT", "Capricorn", "Startup founder với tâm hồn nghệ sĩ. Thích leo núi, viết nhật ký và trò chuyện bên bếp lửa.", 81, [["Love", 4], ["Communication", 4], ["Spirituality", 4]], "Hồ sơ minh hoạ của Trân đặt sự tôn trọng và cam kết làm nền tảng cho kết nối lâu dài."],
].map(([name, initials, sign, bio, score, details, description], index) => ({
  id: index + 1,
  name: name as string,
  initials: initials as string,
  sign: sign as string,
  bio: bio as string,
  score: score as number,
  details: details as [string, number][],
  description: description as string,
}));
