# Vận hành cộng đồng Thật Space

Áp dụng cho bản beta dùng Discourse. Người dùng mới cần lời mời và phê duyệt
của quản trị viên. Artist, Host, Observer và các lựa chọn Q1 là nhóm sở thích;
chúng không cấp quyền quản trị hay kiểm duyệt.

## Tiếp nhận thành viên

1. Gửi lời mời sau khi thống nhất cách kích hoạt tài khoản của beta. Khi chưa
   có email hoạt động, dùng quy trình kích hoạt và khôi phục có hỗ trợ của quản
   trị viên đã được kiểm chứng trên máy chủ.
2. Thành viên hoàn thành 15 câu hỏi. Câu trả lời mặc định chỉ thành viên đó và
   nhân sự có quyền quản trị xem được; thành viên khác không xem được qua hồ sơ
   hoặc thẻ người dùng.
3. Phê duyệt trong quản trị người dùng. Kiểm tra đăng nhập, bài giới thiệu và
   thông báo trả lời.
4. Q1 được ánh xạ sang nhóm ở lần đăng nhập đầu. Khi thành viên sửa Q1, nhân sự
   cập nhật lại nhóm và bỏ nhóm cũ; Automation hiện tại chỉ thêm nhóm.

Không dùng câu trả lời đăng ký làm thẻ ghép đôi. Bà Mối có quy trình đồng ý,
phỏng vấn và xác nhận thẻ riêng. Quản trị viên vẫn có thể đọc PM trong Discourse;
lời đồng ý của Bà Mối cần nói rõ điều này.

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
