export default function TuViPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        {/* Decorative star/lotus SVG */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C4A882]/20 mb-5">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="lotus star icon"
          >
            {/* Lotus petals */}
            <ellipse cx="24" cy="24" rx="5" ry="12" fill="#C4A882" opacity="0.8" />
            <ellipse cx="24" cy="24" rx="5" ry="12" fill="#C4A882" opacity="0.8" transform="rotate(45 24 24)" />
            <ellipse cx="24" cy="24" rx="5" ry="12" fill="#C4A882" opacity="0.8" transform="rotate(90 24 24)" />
            <ellipse cx="24" cy="24" rx="5" ry="12" fill="#C4A882" opacity="0.8" transform="rotate(135 24 24)" />
            {/* Center circle */}
            <circle cx="24" cy="24" r="6" fill="#5C3D2E" />
            <circle cx="24" cy="24" r="3" fill="#F5F0E8" />
          </svg>
        </div>

        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#5C3D2E] font-bold mb-4">
          Tử Vi — Lá Số Tử Vi
        </h1>
        <p className="text-[#5C3D2E]/70 max-w-2xl mx-auto leading-relaxed text-base">
          Tử Vi là hệ thống chiêm tinh học cổ đại của người Việt, được xây dựng dựa trên ngày giờ sinh
          để lập lá số 12 cung mệnh — tiết lộ tính cách, duyên số và những giai đoạn quan trọng trong
          cuộc đời bạn.
        </p>
      </div>

      {/* Birth Info Form */}
      <div className="bg-white/60 border border-[#C4A882]/30 rounded-2xl p-8 mb-10 shadow-sm">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#5C3D2E] mb-6">
          Nhập thông tin của bạn
        </h2>
        <form className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="tuvi-name"
              className="block text-sm font-medium text-[#5C3D2E] mb-1.5"
            >
              Name (Họ và tên)
            </label>
            <input
              id="tuvi-name"
              type="text"
              name="name"
              placeholder="e.g. Nguyễn Thị Mai"
              className="w-full bg-[#F5F0E8] border border-[#C4A882]/40 rounded-xl px-4 py-3 text-sm text-[#5C3D2E] placeholder-[#5C3D2E]/40 focus:outline-none focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] transition-colors"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="tuvi-dob"
              className="block text-sm font-medium text-[#5C3D2E] mb-1.5"
            >
              Date of birth (Ngày sinh)
            </label>
            <input
              id="tuvi-dob"
              type="date"
              name="dateOfBirth"
              className="w-full bg-[#F5F0E8] border border-[#C4A882]/40 rounded-xl px-4 py-3 text-sm text-[#5C3D2E] focus:outline-none focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] transition-colors"
            />
          </div>

          {/* Time of Birth */}
          <div>
            <label
              htmlFor="tuvi-tob"
              className="block text-sm font-medium text-[#5C3D2E] mb-1.5"
            >
              Time of birth (Giờ sinh)
            </label>
            <input
              id="tuvi-tob"
              type="time"
              name="timeOfBirth"
              className="w-full bg-[#F5F0E8] border border-[#C4A882]/40 rounded-xl px-4 py-3 text-sm text-[#5C3D2E] focus:outline-none focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] transition-colors"
            />
          </div>

          {/* Place of Birth */}
          <div>
            <label
              htmlFor="tuvi-pob"
              className="block text-sm font-medium text-[#5C3D2E] mb-1.5"
            >
              Place of birth (Nơi sinh)
            </label>
            <input
              id="tuvi-pob"
              type="text"
              name="placeOfBirth"
              placeholder="e.g. Hà Nội"
              className="w-full bg-[#F5F0E8] border border-[#C4A882]/40 rounded-xl px-4 py-3 text-sm text-[#5C3D2E] placeholder-[#5C3D2E]/40 focus:outline-none focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] transition-colors"
            />
          </div>

          {/* Generate Reading button — static, no action */}
          <button
            type="button"
            className="w-full bg-[#5C3D2E] text-[#F5F0E8] py-3 rounded-full font-medium hover:bg-[#C4A882] transition-colors shadow-md"
          >
            Generate Reading
          </button>
        </form>
      </div>

      {/* Mock Reading Result Card */}
      <div className="bg-[#F5F0E8] border border-[#C4A882]/40 rounded-2xl shadow-md overflow-hidden mb-8">
        {/* Card header */}
        <div className="bg-[#5C3D2E] px-8 py-6 flex items-center gap-4">
          {/* Decorative lotus SVG in card */}
          <svg
            width="36"
            height="36"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <ellipse cx="24" cy="24" rx="5" ry="12" fill="#C4A882" opacity="0.9" />
            <ellipse cx="24" cy="24" rx="5" ry="12" fill="#C4A882" opacity="0.9" transform="rotate(45 24 24)" />
            <ellipse cx="24" cy="24" rx="5" ry="12" fill="#C4A882" opacity="0.9" transform="rotate(90 24 24)" />
            <ellipse cx="24" cy="24" rx="5" ry="12" fill="#C4A882" opacity="0.9" transform="rotate(135 24 24)" />
            <circle cx="24" cy="24" r="6" fill="#F5F0E8" />
            <circle cx="24" cy="24" r="3" fill="#5C3D2E" />
          </svg>
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#F5F0E8]">
              Your Reading
            </h2>
            <p className="text-[#C4A882] text-sm mt-0.5">Nguyễn Thị Mai · 1996 · Hà Nội</p>
          </div>
        </div>

        {/* Reading subsections */}
        <div className="p-8 space-y-8">
          {/* Love & Relationships */}
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#5C3D2E] mb-3 flex items-center gap-2">
              <span className="text-[#C4A882]">✦</span> Love &amp; Relationships
            </h3>
            <p className="text-[#5C3D2E]/80 leading-relaxed">
              Sao Hồng Loan chiếu mệnh mang đến nguồn năng lượng tình cảm rực rỡ trong năm nay,
              giúp bạn thu hút những kết nối tâm hồn sâu sắc và chân thực.
              Với những người độc thân, một mối tình đẹp đang chờ đợi vào khoảng tháng 7–9 — hãy
              mở lòng đón nhận cơ hội bất ngờ.
              Với những người đã có đôi, tình cảm sẽ thêm gắn kết và ổn định, đây là thời điểm lý
              tưởng để cùng nhau xây dựng nền móng lâu dài cho tương lai.
            </p>
          </div>

          <hr className="border-[#C4A882]/20" />

          {/* Career & Purpose */}
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#5C3D2E] mb-3 flex items-center gap-2">
              <span className="text-[#C4A882]">✦</span> Career &amp; Purpose
            </h3>
            <p className="text-[#5C3D2E]/80 leading-relaxed">
              Sao Thiên Phúc và Lộc Tồn cùng hội tụ, báo hiệu một năm thịnh vượng về mặt nghề nghiệp
              và sự phát triển cá nhân đáng kể.
              Bạn có khả năng được thăng tiến hoặc tìm được cơ hội mới phù hợp với đam mê thực sự
              của mình — hãy dũng cảm bước ra khỏi vùng an toàn.
              Đây là thời điểm người ta sẵn sàng lắng nghe và công nhận những ý tưởng sáng tạo của bạn,
              vì vậy hãy mạnh dạn chia sẻ tầm nhìn của mình.
            </p>
          </div>

          <hr className="border-[#C4A882]/20" />

          {/* Spiritual Outlook */}
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#5C3D2E] mb-3 flex items-center gap-2">
              <span className="text-[#C4A882]">✦</span> Spiritual Outlook
            </h3>
            <p className="text-[#5C3D2E]/80 leading-relaxed">
              Mệnh bạn thuộc Hỏa cục, nhưng năm nay được sao Thiên Lương bổ trợ, giúp tâm trí thêm
              bình thản, sáng suốt và kết nối sâu sắc hơn với trực giác nội tâm.
              Đây là thời điểm vàng để thiền định, học hỏi tâm linh hoặc bắt đầu hành trình chữa lành
              nội tâm — những thực hành nhỏ mỗi ngày sẽ tạo ra sự thay đổi lớn.
              Những giấc mơ của bạn trong năm nay sẽ mang nhiều thông điệp ý nghĩa; hãy ghi chép lại
              và lắng nghe tiếng nói của vũ trụ dành riêng cho bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Download PDF Report button — static, no action */}
      <div className="text-center">
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-[#5C3D2E] text-[#F5F0E8] px-8 py-3 rounded-full font-medium hover:bg-[#C4A882] transition-colors shadow-md"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF Report
        </button>
        <p className="text-xs text-[#5C3D2E]/50 mt-2">
          Chức năng tải xuống PDF sẽ có trong phiên bản chính thức
        </p>
      </div>
    </div>
  );
}
