"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const readings = {
  "Phu Thê": { topic: "Love & Relationships", lines: ["Sao Hồng Loan gợi nhắc việc mở lòng với những kết nối sâu sắc và chân thực.", "Một mối quan hệ bền vững được nuôi bằng sự rõ ràng, tôn trọng ranh giới và lựa chọn của cả hai người.", "Hãy xem phần đọc này như một lời mời suy ngẫm, không phải lời dự đoán hay bảo đảm kết quả."] },
  "Quan Lộc": { topic: "Career & Purpose", lines: ["Thiên Phúc và Lộc Tồn gợi nhắc một giai đoạn thuận lợi để nhìn lại mục đích nghề nghiệp và sự phát triển cá nhân.", "Cơ hội phù hợp thường xuất hiện khi bạn dám chia sẻ tầm nhìn và bước ra khỏi vùng an toàn một cách có cân nhắc.", "Dùng các gợi ý này như câu hỏi tự phản chiếu, không thay thế tư vấn nghề nghiệp hay tài chính."] },
  "Phúc Đức": { topic: "Spiritual Outlook", lines: ["Thiên Lương gợi nhắc sự bình thản, sáng suốt và khả năng lắng nghe trực giác nội tâm.", "Những thực hành nhỏ như thiền định hoặc viết nhật ký có thể tạo ra không gian cho chữa lành và tự hiểu mình.", "Tử Vi ở đây là trải nghiệm văn hoá và suy ngẫm, không phải tư vấn y tế hoặc sức khoẻ tâm thần."] },
} as const;
type ReadingKey = keyof typeof readings;
const names = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"];
const branches = ["Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn"];
const positions = [[1,1],[1,2],[1,3],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[3,1],[2,1]];

export default function TuViExperience() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ReadingKey>("Phu Thê");
  const [name, setName] = useState("Nguyễn Thị Mai");
  const readingRef = useRef<HTMLDivElement>(null);
  function generate(event: FormEvent) { event.preventDefault(); setOpen(true); }
  useEffect(() => { if (open) readingRef.current?.focus(); }, [open]);

  return <section className="px-6 pb-24"><div className="paper-shell relative -mt-12 flex flex-wrap items-start gap-8">
    <form className="paper-sheet paper-grain flex max-w-[400px] flex-[1_1_320px] flex-col gap-5 p-8" onSubmit={generate}>
      <h2 className="serif m-0 text-2xl font-medium">Nhập thông tin của bạn</h2>
      <label className="flex flex-col gap-2 text-sm font-semibold">Họ và tên <input required value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 border border-[#C4A882] bg-[#FBF8F2] px-3 font-normal" /></label>
      <label className="flex flex-col gap-2 text-sm font-semibold">Ngày sinh <input required type="date" className="min-h-12 border border-[#C4A882] bg-[#FBF8F2] px-3 font-normal" /></label>
      <label className="flex flex-col gap-2 text-sm font-semibold">Giờ sinh <input required type="time" className="min-h-12 border border-[#C4A882] bg-[#FBF8F2] px-3 font-normal" /></label>
      <label className="flex flex-col gap-2 text-sm font-semibold">Nơi sinh <input required placeholder="e.g. Hà Nội" className="min-h-12 border border-[#C4A882] bg-[#FBF8F2] px-3 font-normal" /></label>
      <button type="submit" className="paper-button paper-button-primary mt-1">Generate Reading</button>
      <p className="m-0 text-xs leading-relaxed text-[#7A5A48]">Bản đọc minh hoạ không được tính từ thông tin bạn nhập và không phải lời khuyên chuyên môn. Dữ liệu trong biểu mẫu chỉ ở trình duyệt, không được gửi hoặc lưu.</p>
    </form>
    <div className="min-w-0 flex-[999_1_560px]">
      {!open ? <div className="paper-sheet paper-grain grid min-h-[620px] place-items-center bg-[#EFE7DA] p-12 text-center [background-image:linear-gradient(45deg,transparent_49.8%,rgba(63,42,31,.12)_50%,transparent_50.2%),linear-gradient(-45deg,transparent_49.8%,rgba(63,42,31,.12)_50%,transparent_50.2%)]"><div><p className="serif text-3xl">Lá số của bạn đang gấp lại</p><p className="max-w-sm leading-relaxed text-[#6E4D3C]">Fill in your birth details and press Generate — your 12-palace sample chart unfolds here.</p></div></div> : <div ref={readingRef} tabIndex={-1} aria-live="polite" className="unfold flex flex-col gap-5"><div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="serif m-0 text-3xl font-medium">Your Reading</h2><p className="m-0 text-sm text-[#7A5A48]">{name} — tap a highlighted palace</p></div><div className="chart-grid paper-grain">{names.map((palace,index) => { const live = palace in readings; const chosen = palace === selected; const content = <><span className="block text-xs uppercase tracking-wider text-[#7A5A48]">{branches[index]}</span><strong className="serif mt-3 block text-lg font-medium">{palace}</strong><span className="mt-3 block text-xs">{live ? readings[palace as ReadingKey].topic : "Full report"}</span></>;
        return live ? <button key={palace} className="palace paper-grain" style={{ gridRow: positions[index][0], gridColumn: positions[index][1] }} data-live="true" type="button" aria-pressed={chosen} onClick={() => setSelected(palace as ReadingKey)}>{content}</button> : <div key={palace} className="palace paper-grain" style={{ gridRow: positions[index][0], gridColumn: positions[index][1] }} data-live="false">{content}</div>; })}<div className="chart-center paper-grain"><div><span className="eyebrow !text-[#C4A882]">Cung {selected} · {readings[selected].topic}</span>{readings[selected].lines.map((line) => <p key={line} className="text-sm leading-relaxed text-[#F5F0E8]">{line}</p>)}</div></div></div></div>}
    </div>
  </div></section>;
}
