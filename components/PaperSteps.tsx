"use client";

import { useState } from "react";

const steps = [
  ["01", "Tham gia", "Join the community", "Đăng ký bằng Google, xác nhận bạn từ đủ 18 tuổi và hoàn tất hồ sơ cộng đồng riêng tư."],
  ["02", "Tử Vi", "Read your chart", "Nhập ngày, giờ và nơi sinh để khám phá 12 cung trong lá số Tử Vi mẫu."],
  ["03", "Kết nối", "Find your people", "Chia sẻ trong cộng đồng thành viên và gặp những người cùng giá trị, sở thích."],
  ["04", "Tìm Duyên", "Meet Bà Mối", "Tự nguyện trò chuyện riêng với Bà Mối, duyệt thẻ ẩn danh và chỉ lộ diện khi cả hai đồng ý."],
];
const tones = [
  { backgroundColor: "#FBF8F2", color: "#5C3D2E", fold: "linear-gradient(90deg,rgba(255,255,255,.18),rgba(63,42,31,.10))" },
  { backgroundColor: "#E2D4BC", color: "#3F2A1F", fold: "linear-gradient(90deg,rgba(63,42,31,.14),rgba(255,255,255,.10))" },
  { backgroundColor: "#C4A882", color: "#3F2A1F", fold: "linear-gradient(90deg,rgba(255,255,255,.18),rgba(63,42,31,.10))" },
  { backgroundColor: "#5C3D2E", color: "#F5F0E8", fold: "linear-gradient(90deg,rgba(63,42,31,.14),rgba(255,255,255,.10))" },
];

export default function PaperSteps() {
  const [active, setActive] = useState(0);
  return (
    <div className="paper-steps" aria-label="Cách Thật Space hoạt động">
      {steps.map(([number, short, title, body], index) => {
        const expanded = index === active;
        return (
          <button key={number} type="button" className="paper-step paper-grain" aria-expanded={expanded} onClick={() => setActive(index)} onMouseEnter={() => setActive(index)} style={{ flexGrow: expanded ? 5 : 1, backgroundColor: tones[index].backgroundColor, color: tones[index].color, backgroundImage: `${tones[index].fold},url(/textures/paper-grain.png)` }}>
            <span className="serif text-6xl font-light">{number}</span>
            {expanded ? <span className="flex max-w-md flex-col gap-2"><strong className="serif text-3xl font-medium">{title}</strong><span className="leading-relaxed opacity-90">{body}</span></span> : <span className="text-sm font-semibold uppercase tracking-[.1em] [writing-mode:vertical-rl] rotate-180">{short}</span>}
          </button>
        );
      })}
    </div>
  );
}
