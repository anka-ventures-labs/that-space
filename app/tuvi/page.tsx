import type { Metadata } from "next";
import TuViExperience from "@/components/TuViExperience";

export const metadata: Metadata = { title: "Tử Vi | Thật Space", description: "Trải nghiệm lá số Tử Vi 12 cung theo ngôn ngữ thiết kế origami của Thật Space." };

export default function TuViPage() {
  return <div className="paper-page paper-grain"><header className="tuvi-sky relative overflow-hidden px-6 pb-24 pt-20 text-[#F5F0E8]"><div className="absolute right-8 top-8 h-24 w-24 rounded-full bg-[#E2D4BC] after:absolute after:-right-5 after:-top-3 after:h-24 after:w-24 after:rounded-full after:bg-[#3F2A1F]" aria-hidden="true" /><div className="paper-shell relative"><span className="eyebrow !text-[#C4A882]">Chiêm tinh Việt</span><h1 className="paper-title mt-4 text-[clamp(42px,5vw,72px)]">Tử Vi — <em className="text-[#C4A882]">Lá Số Tử Vi</em></h1><p className="max-w-3xl text-lg leading-relaxed text-[#E2D4BC]">Một trải nghiệm suy ngẫm lấy cảm hứng từ hệ thống 12 cung mệnh của Tử Vi Việt Nam.</p></div></header><TuViExperience /></div>;
}
