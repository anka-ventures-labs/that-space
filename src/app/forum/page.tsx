import Link from "next/link";
import { forumThreads, forumCategories } from "../../../lib/forum-data";

export default function ForumPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#5C3D2E] font-bold mb-2">
          Cộng Đồng Forum
        </h1>
        <p className="text-[#5C3D2E]/70">
          Nơi chị em chia sẻ, lắng nghe và đồng hành cùng nhau.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Category Sidebar */}
        <aside className="lg:w-60 flex-shrink-0">
          <div className="bg-white/60 border border-[#C4A882]/30 rounded-2xl p-5">
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#5C3D2E] mb-4">
              Chủ đề
            </h2>
            <ul className="space-y-2">
              {forumCategories.map((category) => (
                <li key={category}>
                  <button
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#C4A882]/20 hover:bg-[#C4A882]/30 transition-colors text-left group"
                    aria-label={`Filter by ${category}`}
                  >
                    <span className="text-sm text-[#5C3D2E] font-medium">
                      {category}
                    </span>
                    <span className="text-xs text-[#C4A882] bg-[#C4A882]/30 px-2 py-0.5 rounded-full">
                      {forumThreads.filter((t) => t.category === category).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-5 border-t border-[#C4A882]/30">
              <button className="w-full bg-[#5C3D2E] text-[#F5F0E8] py-2.5 rounded-full text-sm font-medium hover:bg-[#C4A882] transition-colors">
                + Tạo bài viết mới
              </button>
            </div>
          </div>
        </aside>

        {/* Thread List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-[#5C3D2E]/60">{forumThreads.length} bài viết</p>
            <select className="text-sm text-[#5C3D2E] bg-white/60 border border-[#C4A882]/30 rounded-lg px-3 py-1.5">
              <option>Mới nhất</option>
              <option>Phổ biến nhất</option>
              <option>Nhiều reply nhất</option>
            </select>
          </div>

          <div className="space-y-3">
            {forumThreads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white/60 border border-[#C4A882]/30 rounded-2xl p-5 hover:shadow-md hover:border-[#C4A882] transition-all duration-200 group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C4A882]/40 flex items-center justify-center text-[#5C3D2E] font-semibold">
                    {thread.authorName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/forum/${thread.slug}`}
                        className="font-medium text-[#5C3D2E] group-hover:text-[#C4A882] transition-colors leading-snug hover:underline"
                      >
                        {thread.title}
                      </Link>
                      <span className="flex-shrink-0 text-xs bg-[#C4A882]/20 text-[#5C3D2E] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {thread.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#5C3D2E]/50">
                      <span>{thread.authorName}</span>
                      <span>·</span>
                      <span>{thread.timestamp}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <span>💬</span>
                        <span className="bg-[#C4A882]/20 text-[#5C3D2E] px-1.5 py-0.5 rounded-full font-medium">
                          {thread.replyCount}
                        </span>
                        <span>replies</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
