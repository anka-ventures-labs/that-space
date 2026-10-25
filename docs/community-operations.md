# Vận hành cộng đồng Thật Space

Áp dụng cho bản ra mắt mềm dùng Discourse, dành cho bất kỳ ai từ đủ 18 tuổi và
không giới hạn giới tính. Người dùng mới tự đăng ký bằng Google; không cần lời
mời hay phê duyệt của quản trị viên. Artist, Host, Observer và các lựa chọn Q1
là nhóm sở thích;
chúng không cấp quyền quản trị hay kiểm duyệt.

## Tiếp nhận thành viên

1. Thành viên chọn Đăng ký, hoàn tất Google OAuth, xác nhận điều kiện 18+ và
   trả lời Q1 (vai trò). 14 câu hỏi cộng đồng còn lại là tùy chọn, thành viên
   trả lời sau trong hồ sơ. Không yêu cầu ảnh giấy tờ tùy thân.
2. Câu trả lời mặc định chỉ thành viên đó và
   nhân sự có quyền quản trị xem được; thành viên khác không xem được qua hồ sơ
   hoặc thẻ người dùng.
3. Q1 được ánh xạ sang nhóm ở lần đăng nhập đầu. Khi thành viên sửa Q1, nhân sự
   cập nhật lại nhóm và bỏ nhóm cũ; Automation hiện tại chỉ thêm nhóm.
4. Nếu người dùng mất tài khoản Google, quy trình khôi phục cần nhân sự hỗ trợ
   vì hệ thống không có mật khẩu cục bộ hay email giao dịch.

Không dùng câu trả lời đăng ký làm thẻ ghép đôi. Bà Mối có quy trình đồng ý,
phỏng vấn và xác nhận thẻ riêng. Quản trị viên vẫn có thể đọc PM trong
Discourse; lời đồng ý của Bà Mối nói rõ điều này. Mọi thành viên thường thuộc
`trust_level_0` được dùng Bà Mối; giữ tên bot và nhóm cho phép đồng bộ với trình
cài đặt.

Lộ diện, kết thúc, chặn và xóa dữ liệu cần hai lượt: dịch vụ phát token ngắn
hạn, dùng một lần, gắn với đúng thành viên, chủ đề, bài viết khởi tạo, hành động
và đối tượng. Dịch vụ chỉ chấp nhận token từ một bài viết thành viên mới hơn;
Bà Mối vì vậy chỉ gửi lại token sau câu xác nhận tiếp theo. Trước lộ diện, bộ
chuyển tiếp giữ lại thông tin liên hệ kể cả khi thành viên chia chúng thành nhiều
tin nhắn. Phần văn bản tạm này bị xóa ngay khi lộ diện, kết thúc hoặc chặn.

## Bài viết, tác phẩm và sự kiện

- Diễn đàn: dùng chủ đề và trả lời của Discourse. Nhân sự ghim/khóa chủ đề, sửa
  danh mục và xử lý báo cáo theo quyền được cấp.
- Triển lãm: đăng tác phẩm kèm ảnh và câu chuyện. Tab Tác phẩm ở hồ sơ lấy bài
  của chính tác giả trong danh mục Triển lãm.
- Hồ sơ: sửa giới thiệu, ảnh nền và chủ đề nổi bật trong tùy chọn hồ sơ.
- Retreat & Workshop: Host tạo bài sự kiện bằng công cụ sự kiện của trình soạn
  thảo; thành viên chọn tham dự/quan tâm. Host chỉ sửa nội dung của mình.
- Thông báo: chỉ nhân sự đăng bài; thành viên đọc được.
- Theo dõi: theo dõi người khác để nhận thông báo bài mới; mỗi người có thể tắt
  quyền được theo dõi. Dùng bỏ qua/tắt thông báo ở hồ sơ để giới hạn liên hệ.

## Kiểm duyệt

Mở hàng đợi Review để xử lý báo cáo. Đọc ngữ cảnh trước khi đồng ý hoặc bác bỏ.
Quyền đình chỉ/xóa nội dung chỉ dành cho nhân sự có quyền phù hợp. Thành viên
thường không truy cập hàng đợi này.

Sau khi kiểm chứng mô hình, bộ phân loại AI đưa spam, đe dọa, quấy rối, thù ghét
hoặc tiết lộ thông tin riêng vào hàng đợi. Nó không tự ẩn/xóa bài, trả lời hay
đình chỉ thành viên. Nó không phân loại PM, bài của bot hoặc câu trả lời đăng ký.
Kiểm tra các ví dụ tiếng Việt lành tính và vi phạm trước khi bật cho người thật;
điều chỉnh prompt có phiên bản trong kho mã.

## Khôi phục và thay đổi cấu hình

Xác minh danh tính qua kênh đã thống nhất trước khi khôi phục tài khoản. Không
gửi mật khẩu/API key trong chủ đề/PM chung. Không đổi tài khoản nhân sự thành
tài khoản thử nghiệm và không bật Git auto-deploy của Vercel.

Backup cơ sở dữ liệu và uploads trước khi thay đổi dữ liệu thật. Cấu hình lịch
backup, lưu ngoài máy chủ và kiểm chứng restore ở môi trường cách ly trước khi
mời beta. Backup chưa restore thành công không phải bằng chứng phục hồi.

Chạy `--check` để xem drift, kiểm tra lý do trước khi `apply`. Không tự tiếp quản
danh mục, nhóm, theme hoặc agent trùng tên nhưng chưa có dấu sở hữu. Quy trình
kỹ thuật và các bước chấp nhận còn lại nằm trong [community-build.md](community-build.md).
