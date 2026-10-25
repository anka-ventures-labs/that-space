"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { forumThreads, type ForumCategory } from "@/lib/origami-data";

const categories: ("All" | ForumCategory)[] = ["All", "Introductions", "Life & Growth", "Relationships", "Spirituality"];
const tones: Record<ForumCategory, { edge: string; chip: string }> = {
  Introductions: { edge: "#E2D4BC", chip: "#F1E9DC" },
  "Life & Growth": { edge: "#C4A882", chip: "#EADFCB" },
  Relationships: { edge: "#8A6450", chip: "#E5D6C2" },
  Spirituality: { edge: "#5C3D2E", chip: "#DCCAAE" },
};

export default function ForumExplorer({ actionHref }: { actionHref: string }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [sort, setSort] = useState("new");
  const visible = useMemo(() => {
    const filtered = category === "All" ? forumThreads : forumThreads.filter((thread) => thread.category === category);
    return sort === "replies" ? [...filtered].sort((a, b) => b.replies - a.replies) : filtered;
  }, [category, sort]);

  return (
    <div className="paper-shell forum-layout">
      <aside className="forum-filter paper-sheet paper-grain p-5" aria-label="Lọc chủ đề">
        <h2 className="serif m-0 mb-4 text-xl font-medium">Chủ đề</h2>
        <div className="flex flex-col gap-2">
          {categories.map((item) => {
            const selected = item === category;
            const count = item === "All" ? forumThreads.length : forumThreads.filter((thread) => thread.category === item).length;
            return <button key={item} type="button" className="filter-button" aria-pressed={selected} onClick={() => setCategory(item)} style={{ borderLeftColor: item === "All" ? "#A88B66" : tones[item].edge, background: selected ? "#5C3D2E" : "#FBF8F2", color: selected ? "#F5F0E8" : "#5C3D2E" }}><span>{item === "All" ? "Tất cả" : item}</span><span>{count}</span></button>;
          })}
        </div>
        <Link href={actionHref} className="paper-button paper-button-primary mt-5 w-full">Tạo bài viết mới</Link>
      </aside>
      <section className="min-w-0 flex-[999_1_560px]" aria-label="Bài viết mẫu">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <p className="m-0 text-sm text-[#6E4D3C]">{visible.length} bài viết · {category === "All" ? "Tất cả chủ đề" : category}</p>
          <label className="flex items-center gap-2 text-sm text-[#6E4D3C]">Sắp xếp <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 border border-[#C4A882] bg-[#FBF8F2] px-3 text-[#5C3D2E]"><option value="new">Mới nhất</option><option value="replies">Nhiều reply nhất</option></select></label>
        </div>
        <div className="flex flex-col gap-4">
          {visible.map((thread) => <article key={thread.slug} className="thread-slip paper-grain" style={{ borderLeft: `10px solid ${tones[thread.category].edge}` }}>
            <span className="avatar-fold h-12 w-12 text-xl" aria-hidden="true">{thread.author.split(" ").at(-1)?.[0]}</span>
            <div className="min-w-0 flex-1"><Link href={`/forum/${thread.slug}`} className="serif text-xl font-medium leading-snug no-underline hover:text-[#3F2A1F]">{thread.title}</Link><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#7A5A48]"><span className="px-2 py-1 font-semibold text-[#5C3D2E]" style={{ background: tones[thread.category].chip }}>{thread.category}</span><span>{thread.author}</span><span>·</span><span>{thread.time}</span></div></div>
            <div className="flex-none border-l border-dashed border-[#D2BE9C] pl-4 text-center"><strong className="serif block text-2xl font-medium">{thread.replies}</strong><span className="text-xs text-[#7A5A48]">phản hồi</span></div>
          </article>)}
        </div>
        <p className="mt-6 text-sm leading-relaxed text-[#7A5A48]">Đây là bản xem trước công khai. Đăng bài, nhắn tin và hồ sơ thành viên được bảo vệ trong cộng đồng sau khi đăng nhập.</p>
      </section>
    </div>
  );
}
