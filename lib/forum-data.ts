export interface ForumReply {
  authorName: string;
  timestamp: string;
  body: string;
}

export interface ForumThread {
  id: string;
  slug: string;
  title: string;
  authorName: string;
  timestamp: string;
  replyCount: number;
  category: string;
  body: string;
  replies: ForumReply[];
}

export const forumThreads: ForumThread[] = [
  {
    id: "1",
    slug: "gioi-thieu-ban-than",
    title: "Mình mới gia nhập Thật Space — xin chào tất cả chị em! 🌸",
    authorName: "Nguyễn Thị Mai",
    timestamp: "2 giờ trước",
    replyCount: 24,
    category: "Introductions",
    body: "Chào tất cả chị em trong Thật Space! Mình là Mai, 28 tuổi, hiện đang sống và làm việc tại Hà Nội. Mình tìm đến Thật Space vì muốn có một không gian an toàn để chia sẻ những suy nghĩ thật lòng — những điều mà đôi khi khó nói với gia đình hay bạn bè bên ngoài. Mình đặc biệt hứng thú với phần Tử Vi và rất mong được học hỏi từ chị em ở đây.",
    replies: [
      {
        authorName: "Trần Minh Châu",
        timestamp: "2 giờ trước",
        body: "Chào mừng Mai đến với Thật Space! Mình cũng rất yêu Tử Vi và chắc chắn hai đứa sẽ có nhiều điều để trò chuyện. Bạn theo dõi cung nào vậy? 🌸",
      },
      {
        authorName: "Lê Phương Linh",
        timestamp: "1 giờ trước",
        body: "Welcome bạn Mai! Cộng đồng ở đây rất ấm áp và chan hoà, bạn sẽ thấy thoải mái ngay thôi. Đừng ngại chia sẻ nhé, ở đây ai cũng lắng nghe chân thành. 💗",
      },
      {
        authorName: "Võ Thanh Thảo",
        timestamp: "45 phút trước",
        body: "Ôi kỹ sư phần mềm mà lại mê Tử Vi — mình cũng vậy! Có vẻ như những người làm kỹ thuật lại hay tìm về những thứ huyền bí để cân bằng phải không. Rất vui được kết bạn với bạn! 😄",
      },
      {
        authorName: "Nguyễn Bảo Anh",
        timestamp: "30 phút trước",
        body: "Chào Mai! Mình cũng mới vào khoảng 2 tháng trước và cảm thấy đây thực sự là không gian mình đang cần. Hy vọng bạn cũng tìm thấy sự kết nối tương tự ở đây nha 🌙✨",
      },
    ],
  },
  {
    id: "2",
    slug: "hanh-trinh-yoga-cua-minh",
    title: "Chia sẻ về hành trình yoga của mình sau 6 tháng kiên trì",
    authorName: "Lê Phương Linh",
    timestamp: "5 giờ trước",
    replyCount: 35,
    category: "Life & Growth",
    body: "Sáu tháng trước mình bắt đầu tập yoga chỉ vì muốn giảm đau lưng, nhưng giờ đây nó đã trở thành một phần không thể thiếu trong cuộc sống hằng ngày của mình. Ban đầu mình tập chỉ 15 phút mỗi buổi sáng, dần dần tăng lên 45 phút và đến nay mình không thể tưởng tượng một ngày không có yoga. Điều kỳ diệu nhất không phải là cơ thể dẻo dai hơn mà là tâm trí mình đã bình tĩnh và sáng suốt hơn rất nhiều. Mình muốn chia sẻ hành trình này để truyền cảm hứng cho chị em nào đang phân vân bắt đầu.",
    replies: [
      {
        authorName: "Phạm Hương Giang",
        timestamp: "4 giờ trước",
        body: "Mình cũng đang trong hành trình yoga được 3 tháng rồi! Bạn đúng khi nói về sự thay đổi tinh thần — mình ngủ ngon hơn hẳn và ít lo âu hơn nhiều. Bạn tập theo phong cách yoga nào vậy?",
      },
      {
        authorName: "Đỗ Kiều Trang",
        timestamp: "3 giờ trước",
        body: "Cảm ơn bạn đã chia sẻ! Mình đang rất muốn bắt đầu nhưng cứ ngại vì nghĩ bản thân không đủ dẻo. Bạn có gợi ý nào cho người mới hoàn toàn không?",
      },
      {
        authorName: "Huỳnh Ngọc Trân",
        timestamp: "2 giờ trước",
        body: "6 tháng kiên trì thật đáng nể! Mình đã từng bỏ cuộc sau 2 tuần vì quá bận. Câu chuyện của bạn khiến mình muốn thử lại một lần nữa, lần này sẽ cố gắng hơn.",
      },
    ],
  },
  {
    id: "3",
    slug: "co-don-trong-dam-dong",
    title: "Có ai cũng cảm thấy cô đơn trong đám đông không?",
    authorName: "Trần Minh Châu",
    timestamp: "1 ngày trước",
    replyCount: 63,
    category: "Relationships",
    body: "Mình có rất nhiều bạn bè, luôn được mời đến các buổi tụ tập, nhưng thỉnh thoảng mình vẫn cảm thấy rất cô đơn dù đang ngồi giữa mọi người. Cảm giác này thật kỳ lạ và khó diễn đạt — như kiểu bạn ở đó nhưng không thực sự hiện diện. Mình không chắc đây là vấn đề của mình hay đây là điều mà nhiều người cảm nhận nhưng không dám nói. Mình muốn hỏi chị em ở đây để hiểu hơn về bản thân mình.",
    replies: [
      {
        authorName: "Nguyễn Thị Mai",
        timestamp: "23 giờ trước",
        body: "Mình hoàn toàn hiểu cảm giác này! Đó không phải là điều gì sai với bạn đâu. Nhiều khi sự kết nối bề mặt không đủ để lấp đầy cái cô đơn sâu bên trong. Mình đọc sách về điều này và thấy rất nhiều người cùng trải qua.",
      },
      {
        authorName: "Phan Thị Lan",
        timestamp: "20 giờ trước",
        body: "Cảm ơn bạn đã dũng cảm chia sẻ điều này. Mình cũng từng trải qua và tìm ra rằng mình cần những cuộc trò chuyện chiều sâu hơn là những buổi tụ tập đông người. Bạn thử tìm những người bạn cùng sở thích sâu sắc hơn xem sao.",
      },
      {
        authorName: "Võ Thanh Thảo",
        timestamp: "15 giờ trước",
        body: "Cảm giác này có tên gọi là 'existential loneliness' và rất nhiều người trải qua nó. Đây không phải lỗi của bạn — đôi khi chúng ta cần không gian để nhìn vào bên trong, và Thật Space chính là nơi tốt để làm điều đó.",
      },
      {
        authorName: "Bùi Minh Hạnh",
        timestamp: "10 giờ trước",
        body: "Thread này chạm đến lòng mình quá! Mình đã nghĩ chỉ có mình mới như vậy. Biết được rằng nhiều chị em cùng cảm nhận cũng khiến mình thấy bớt cô đơn hơn một chút rồi.",
      },
    ],
  },
  {
    id: "4",
    slug: "thien-dinh-buoi-sang",
    title: "Thực hành thiền định buổi sáng đã thay đổi cuộc sống mình",
    authorName: "Phạm Hương Giang",
    timestamp: "2 ngày trước",
    replyCount: 41,
    category: "Spirituality",
    body: "Mình bắt đầu thiền định buổi sáng từ năm ngoái và đến nay đây là thói quen quan trọng nhất trong ngày của mình. Chỉ cần 10-20 phút ngồi yên lặng và quan sát hơi thở, mình nhận ra rằng tâm trí mình ít bị kéo đi bởi lo lắng và phán xét hơn rất nhiều. Điều đặc biệt là mình xử lý các tình huống căng thẳng trong công việc và các mối quan hệ tốt hơn hẳn so với trước. Chị em nào đang muốn bắt đầu thì đừng chờ đợi — hãy thử ngay hôm nay, chỉ 5 phút thôi cũng được.",
    replies: [
      {
        authorName: "Nguyễn Bảo Anh",
        timestamp: "2 ngày trước",
        body: "Mình đồng ý 100%! Thiền định giúp mình cũng bình tĩnh hơn trước mọi chuyện. Bạn dùng app nào để thiền hay tự thiền không?",
      },
      {
        authorName: "Lê Phương Linh",
        timestamp: "1 ngày trước",
        body: "Mình đã thử nhiều lần nhưng tâm trí cứ lăng xăng không ngừng. Bạn có tip gì cho người hay bị phân tâm không? Mình rất muốn duy trì thói quen này.",
      },
      {
        authorName: "Trần Minh Châu",
        timestamp: "1 ngày trước",
        body: "Cảm ơn bạn chia sẻ! Mình kết hợp thiền định với nhật ký buổi sáng và thấy hiệu quả tuyệt vời. Cả hai hoạt động này giúp mình bắt đầu ngày mới với tâm trạng tích cực.",
      },
    ],
  },
  {
    id: "5",
    slug: "vuot-qua-chia-tay",
    title: "Làm thế nào để vượt qua chia tay khi yêu nhau 3 năm?",
    authorName: "Võ Thanh Thảo",
    timestamp: "3 ngày trước",
    replyCount: 78,
    category: "Relationships",
    body: "Mình vừa chia tay người yêu sau 3 năm gắn bó và thật lòng mình không biết phải bắt đầu lại từ đâu. Họ là một phần rất lớn trong cuộc sống hằng ngày của mình — từ buổi sáng thức dậy cho đến lúc đi ngủ đều có họ. Mình biết rằng đây là quyết định đúng đắn vì hai người thật sự không hợp nhau về tương lai, nhưng trái tim thì không nghe lời lý trí. Chị em nào đã vượt qua giai đoạn này, mình rất cần lời khuyên và sự chia sẻ.",
    replies: [
      {
        authorName: "Phan Thị Lan",
        timestamp: "3 ngày trước",
        body: "Mình đã từng ở vị trí của bạn sau 4 năm yêu nhau. Điều giúp mình nhất là cho phép bản thân buồn — đừng cố tỏ ra mạnh mẽ quá. Sau khoảng 3 tháng, mọi thứ sẽ bắt đầu nhẹ dần.",
      },
      {
        authorName: "Đỗ Kiều Trang",
        timestamp: "2 ngày trước",
        body: "Hãy đầu tư thời gian vào bản thân — học điều gì đó mới, du lịch, gặp gỡ bạn bè. Giai đoạn đau khổ này thật ra là cơ hội để bạn khám phá lại chính mình.",
      },
      {
        authorName: "Huỳnh Ngọc Trân",
        timestamp: "2 ngày trước",
        body: "Đừng rush bản thân phải 'ổn' ngay. Mỗi người có timeline chữa lành riêng. Nhưng mình khuyên bạn nên tránh liên lạc với họ một thời gian — 'no contact' thực sự giúp ích rất nhiều đấy.",
      },
      {
        authorName: "Bùi Minh Hạnh",
        timestamp: "1 ngày trước",
        body: "Mình gửi cho bạn thật nhiều năng lượng và tình yêu thương từ xa! Thật Space luôn ở đây với bạn. Chia sẻ nhiều hơn nếu bạn cần nhé — đây là không gian an toàn để bạn nói ra tất cả.",
      },
    ],
  },
  {
    id: "6",
    slug: "ket-ban-tuoi-30",
    title: "Kết bạn mới tuổi 30 có khó không? Trải nghiệm của mình",
    authorName: "Đỗ Kiều Trang",
    timestamp: "4 ngày trước",
    replyCount: 52,
    category: "Life & Growth",
    body: "Người ta hay nói kết bạn sau tuổi 30 rất khó, và mình đã từng rất sợ điều đó. Nhưng sau khi chuyển đến thành phố mới 2 năm trước, mình buộc phải học cách làm quen với người lạ và mình đã kết được những tình bạn sâu sắc hơn rất nhiều so với thời đại học. Bí quyết của mình là theo đuổi sở thích thật sự — câu lạc bộ đọc sách, lớp nấu ăn, nhóm chạy bộ. Ở đó bạn tìm được người cùng tần số ngay từ đầu.",
    replies: [
      {
        authorName: "Nguyễn Thị Mai",
        timestamp: "4 ngày trước",
        body: "Cảm ơn bạn đã chia sẻ điều này! Mình cũng vừa chuyển đến Hà Nội và đang cảm thấy rất khó kết bạn mới. Bạn có thể kể thêm về câu lạc bộ đọc sách mà bạn tham gia không?",
      },
      {
        authorName: "Lê Phương Linh",
        timestamp: "3 ngày trước",
        body: "Đúng vậy! Mình tham gia một nhóm yoga và kết được 3 người bạn thân từ đó. Khi có chung hoạt động, việc trò chuyện tự nhiên hơn nhiều so với cố tình 'làm quen'.",
      },
      {
        authorName: "Phạm Hương Giang",
        timestamp: "3 ngày trước",
        body: "Thật Space chính là bằng chứng cho điều này đó — mình đã kết bạn với nhiều chị em thú vị qua cộng đồng online trước khi gặp ngoài đời thực. Đôi khi kết nối tinh thần còn dễ hơn kết nối vật lý.",
      },
    ],
  },
  {
    id: "7",
    slug: "phong-thuy-nha-o",
    title: "Phong thủy cho phòng ngủ — thu hút năng lượng tốt cho năm mới",
    authorName: "Bùi Minh Hạnh",
    timestamp: "5 ngày trước",
    replyCount: 29,
    category: "Spirituality",
    body: "Mình vừa sắp xếp lại phòng ngủ theo nguyên tắc phong thủy và thật ngạc nhiên khi thấy sự khác biệt rõ rệt chỉ sau vài tuần. Giường đặt theo hướng đầu về phía bắc, gương không đối diện với giường, cây xanh nhỏ ở góc phòng và ánh sáng ấm tối trước khi ngủ. Mình ngủ ngon hơn, tinh thần nhẹ nhàng hơn khi thức dậy. Mình muốn chia sẻ những điều nhỏ này với chị em vì tin rằng không gian sống ảnh hưởng rất nhiều đến năng lượng của chúng ta.",
    replies: [
      {
        authorName: "Nguyễn Bảo Anh",
        timestamp: "5 ngày trước",
        body: "Mình rất tin vào phong thủy! Bạn có thể chia sẻ thêm về vị trí đặt các loại cây trong phòng không? Mình đang muốn thêm cây xanh vào không gian sống.",
      },
      {
        authorName: "Phạm Hương Giang",
        timestamp: "4 ngày trước",
        body: "Cảm ơn bạn đã chia sẻ! Mình chưa bao giờ nghĩ đến phong thủy cho phòng ngủ nhưng sau khi đọc bài của bạn mình muốn thử. Hướng đầu giường về phía bắc là nguyên tắc chung hay tùy theo tuổi mỗi người?",
      },
      {
        authorName: "Trần Minh Châu",
        timestamp: "4 ngày trước",
        body: "Không gian sống thực sự ảnh hưởng đến tâm trạng rất nhiều! Mình vừa dọn dẹp và trang trí lại bàn làm việc, thấy cảm giác tập trung và sáng tạo hơn hẳn. Năng lượng của không gian thật sự có thật.",
      },
    ],
  },
  {
    id: "8",
    slug: "yeu-ban-than",
    title: "Self-love trong văn hoá Việt Nam — câu chuyện của mình",
    authorName: "Huỳnh Ngọc Trân",
    timestamp: "1 tuần trước",
    replyCount: 94,
    category: "Life & Growth",
    body: "Lớn lên trong văn hóa Việt Nam, mình được dạy rằng đặt bản thân lên trước là ích kỷ. Phụ nữ tốt phải hy sinh, nhường nhịn, và luôn đặt người khác lên trước. Mình mất gần 30 năm để nhận ra rằng đây là một niềm tin đã ăn mòn sức khỏe tinh thần của mình. Hành trình học yêu thương bản thân của mình không dễ — nó đòi hỏi phải đặt câu hỏi lại về rất nhiều điều được coi là 'đương nhiên' từ gia đình và xã hội. Nhưng đây là hành trình xứng đáng nhất mình từng thực hiện.",
    replies: [
      {
        authorName: "Võ Thanh Thảo",
        timestamp: "1 tuần trước",
        body: "Bài viết này chạm đúng vào điều mình đang trải qua. Mình cũng đang học cách nói 'không' mà không cảm thấy tội lỗi. Đây thực sự là cuộc cách mạng cá nhân với người phụ nữ Việt.",
      },
      {
        authorName: "Phan Thị Lan",
        timestamp: "6 ngày trước",
        body: "Cảm ơn bạn đã chia sẻ câu chuyện này. Là mẹ đơn thân, mình thường xuyên quên mất bản thân trong việc chăm sóc con. Đọc bài của bạn nhắc mình rằng mình cũng cần được chăm sóc.",
      },
      {
        authorName: "Đỗ Kiều Trang",
        timestamp: "5 ngày trước",
        body: "Văn hóa hy sinh của người phụ nữ Việt Nam vừa đẹp vừa là gánh nặng. Mình nghĩ thế hệ chúng ta đang dần học cách cân bằng giữa yêu thương người khác và yêu thương bản thân.",
      },
      {
        authorName: "Nguyễn Thị Mai",
        timestamp: "4 ngày trước",
        body: "Thread này nên được ghim lại! Mình sẽ chia sẻ cho nhiều chị em mình biết. Chúng ta cần nhiều cuộc trò chuyện như thế này hơn trong cộng đồng của mình.",
      },
    ],
  },
  {
    id: "9",
    slug: "nuoi-con-mot-minh",
    title: "Những người mẹ đơn thân ở đây — chúng ta cùng chia sẻ nhé",
    authorName: "Phan Thị Lan",
    timestamp: "1 tuần trước",
    replyCount: 112,
    category: "Relationships",
    body: "Mình là mẹ đơn thân của một bé trai 5 tuổi và đã nuôi con một mình được 3 năm rồi. Không có gì chuẩn bị được cho bạn hành trình này — cả niềm vui lẫn những đêm khóc một mình vì kiệt sức. Mình muốn tạo ra một không gian để những người mẹ đơn thân như mình có thể chia sẻ thẳng thắn, không phán xét, không cần tỏ ra hoàn hảo. Đây là nơi an toàn để nói ra những điều mà xã hội chưa sẵn sàng lắng nghe.",
    replies: [
      {
        authorName: "Huỳnh Ngọc Trân",
        timestamp: "1 tuần trước",
        body: "Cảm ơn bạn đã tạo ra không gian này. Mình không phải mẹ đơn thân nhưng mình có người bạn thân đang trải qua điều này và mình muốn hiểu để có thể hỗ trợ tốt hơn.",
      },
      {
        authorName: "Trần Minh Châu",
        timestamp: "6 ngày trước",
        body: "Các bạn mẹ đơn thân thật sự là những người phụ nữ mạnh mẽ nhất mình biết. Mình ngưỡng mộ sức mạnh đó. Các bạn xứng đáng được nhiều sự hỗ trợ và yêu thương hơn từ cộng đồng.",
      },
      {
        authorName: "Võ Thanh Thảo",
        timestamp: "5 ngày trước",
        body: "Mình là mẹ đơn thân được 2 năm. Điều khó nhất với mình là những dịp lễ khi thấy các gia đình đầy đủ. Nhưng mình học được rằng 'gia đình' có thể được định nghĩa lại — cộng đồng như Thật Space này cũng là gia đình của mình.",
      },
      {
        authorName: "Lê Phương Linh",
        timestamp: "4 ngày trước",
        body: "Mình gửi đến tất cả các mẹ đơn thân ở đây thật nhiều yêu thương. Các bạn đang làm điều phi thường mỗi ngày. Hãy nhớ rằng bạn không cần phải một mình — Thật Space luôn ở đây.",
      },
    ],
  },
  {
    id: "10",
    slug: "tu-vi-nam-giap-thin",
    title: "Tử Vi năm Giáp Thìn 2024 — chia sẻ trải nghiệm của các bạn",
    authorName: "Nguyễn Bảo Anh",
    timestamp: "2 tuần trước",
    replyCount: 47,
    category: "Spirituality",
    body: "Năm Giáp Thìn đang đến gần và mình rất tò mò về những dự đoán tử vi cho năm nay. Mình vừa xem tử vi cho tuổi Mùi và thấy có nhiều thay đổi lớn được dự báo — đặc biệt về sự nghiệp và tình cảm. Mình muốn tạo ra một thread để chị em cùng chia sẻ về lá số của mình, những điều đã ứng nghiệm và những điều mà mình tin hoặc không tin. Đây là không gian để thảo luận cởi mở, không phán xét nhé.",
    replies: [
      {
        authorName: "Bùi Minh Hạnh",
        timestamp: "2 tuần trước",
        body: "Tuổi Thìn như mình thì năm nay được dự báo rất tốt về tài lộc! Mình đang cố gắng đón nhận năng lượng tích cực này. Bạn có biết nguồn xem tử vi nào uy tín không?",
      },
      {
        authorName: "Phạm Hương Giang",
        timestamp: "13 ngày trước",
        body: "Mình không hoàn toàn tin vào tử vi nhưng thấy nó là công cụ tốt để tự phản chiếu. Đôi khi đọc tử vi không phải để biết tương lai mà để nhìn lại mình đang ở đâu và muốn đi về đâu.",
      },
      {
        authorName: "Nguyễn Thị Mai",
        timestamp: "12 ngày trước",
        body: "Mình tuổi Hợi và năm nay được dự báo có nhiều biến động. Thay vì lo sợ, mình chọn cách tiếp cận là chuẩn bị tốt hơn cho mọi tình huống. Tử vi chỉ là hướng dẫn, không phải số phận cố định.",
      },
    ],
  },
];

export const forumCategories = [
  "Introductions",
  "Life & Growth",
  "Relationships",
  "Spirituality",
] as const;

export type ForumCategory = (typeof forumCategories)[number];
