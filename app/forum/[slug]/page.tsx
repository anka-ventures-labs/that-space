import Link from "next/link";
import { forumThreads, type ForumThread, type ForumReply } from "@/lib/forum-data";

export function generateStaticParams(): { slug: string }[] {
  return forumThreads.map((thread: ForumThread) => ({ slug: thread.slug }));
}

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const thread = forumThreads.find((t) => t.slug === slug);

  if (!thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#5C3D2E] mb-4">
          Không tìm thấy bài viết
        </h1>
        <p className="text-[#5C3D2E]/70 mb-6">Bài viết này không tồn tại hoặc đã bị xoá.</p>
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 bg-[#5C3D2E] text-[#F5F0E8] px-6 py-2 rounded-full text-sm font-medium hover:bg-[#C4A882] transition-colors"
        >
          ← Quay lại Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-[#5C3D2E]/60 mb-8">
        <Link href="/forum" className="hover:text-[#5C3D2E] transition-colors">
          Forum
        </Link>
        <span>›</span>
        <span className="text-[#C4A882]">{thread.category}</span>
        <span>›</span>
        <span className="truncate max-w-xs text-[#5C3D2E]/80">{thread.title}</span>
      </nav>

      {/* Original Post */}
      <article className="bg-white/60 border border-[#C4A882]/30 rounded-2xl p-8 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#C4A882]/40 flex items-center justify-center text-[#5C3D2E] font-bold text-lg">
            {thread.authorName[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-[#5C3D2E]">{thread.authorName}</span>
              <span className="text-xs bg-[#C4A882]/30 text-[#5C3D2E] px-2 py-0.5 rounded-full">
                Thành viên
              </span>
              <span className="text-xs text-[#5C3D2E]/50">· {thread.timestamp}</span>
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-xl md:text-2xl font-bold text-[#5C3D2E] mb-4 leading-snug">
              {thread.title}
            </h1>
            <div className="text-[#5C3D2E]/80 leading-relaxed text-sm md:text-base">
              {thread.body}
            </div>
            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#C4A882]/20">
              <button className="flex items-center gap-1.5 text-sm text-[#5C3D2E]/60 hover:text-[#C4A882] transition-colors">
                <span>❤️</span> Thích
              </button>
              <button className="flex items-center gap-1.5 text-sm text-[#5C3D2E]/60 hover:text-[#C4A882] transition-colors">
                <span>💬</span> Trả lời
              </button>
              <button className="flex items-center gap-1.5 text-sm text-[#5C3D2E]/60 hover:text-[#C4A882] transition-colors">
                <span>🔗</span> Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Replies */}
      <div className="space-y-4 mb-8">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#5C3D2E]">
          {thread.replies.length} Phản hồi
        </h2>

        {thread.replies.map((reply, index) => (
          <div
            key={index}
            data-testid="reply-card"
            className="bg-white/40 border border-[#C4A882]/20 rounded-2xl p-6 flex items-start gap-4"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C4A882]/30 flex items-center justify-center text-[#5C3D2E] font-semibold">
              {reply.authorName[0]}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-medium text-[#5C3D2E] text-sm">{reply.authorName}</span>
                <span className="text-xs text-[#5C3D2E]/50">· {reply.timestamp}</span>
              </div>
              <p className="text-sm text-[#5C3D2E]/80 leading-relaxed">{reply.body}</p>
              <div className="flex items-center gap-3 mt-3">
                <button className="text-xs text-[#5C3D2E]/50 hover:text-[#C4A882] transition-colors">
                  ❤️ Thích
                </button>
                <button className="text-xs text-[#5C3D2E]/50 hover:text-[#C4A882] transition-colors">
                  💬 Reply
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Box */}
      <div className="bg-white/60 border border-[#C4A882]/30 rounded-2xl p-6 mb-6">
        <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#5C3D2E] mb-4">
          Viết phản hồi
        </h3>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#C4A882]/40 flex items-center justify-center text-[#5C3D2E] font-semibold">
            B
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              aria-label="Nội dung phản hồi"
              className="w-full bg-[#F5F0E8] border border-[#C4A882]/40 rounded-xl p-4 text-sm text-[#5C3D2E] placeholder-[#5C3D2E]/40 resize-none focus:outline-none focus:border-[#C4A882] focus:ring-1 focus:ring-[#C4A882] transition-colors"
              rows={4}
              placeholder="Chia sẻ suy nghĩ của bạn... (giao diện demo — không gửi được)"
              readOnly
            />
            <div className="flex justify-end">
              <button className="bg-[#5C3D2E] text-[#F5F0E8] px-6 py-2 rounded-full text-sm font-medium hover:bg-[#C4A882] transition-colors">
                Đăng phản hồi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/forum"
        className="inline-flex items-center gap-2 text-sm text-[#5C3D2E]/60 hover:text-[#5C3D2E] transition-colors"
      >
        ← Quay lại Forum
      </Link>
    </div>
  );
}
