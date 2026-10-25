import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PreviewBanner from "@/components/PreviewBanner";
import { forumThreads } from "@/lib/origami-data";
import { getPublicSiteConfig } from "@/lib/public-site";

export function generateStaticParams() { return forumThreads.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const thread = forumThreads.find((item) => item.slug === slug);
  return { title: thread ? `${thread.title} | Thật Space` : "Forum | Thật Space", robots: { index: false, follow: false } };
}

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const thread = forumThreads.find((item) => item.slug === slug);
  if (!thread) notFound();
  const site = getPublicSiteConfig();
  const actionHref = site.communityUrl || site.signupHref;
  const actionLabel = site.communityUrl ? "Mở cộng đồng để trả lời" : "Xem cách tham gia";

  return <div className="paper-page paper-grain"><main className="mx-auto flex max-w-[880px] flex-col gap-10 px-6 py-12 md:py-20">
    <PreviewBanner />
    <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[#7A5A48]"><Link href="/forum" className="font-semibold">Forum</Link><span>›</span><span>{thread.category}</span><span>›</span><span className="text-[#5C3D2E]">{thread.title.slice(0,32)}…</span></nav>
    <article className="thread-paper paper-grain"><div className="relative flex flex-col gap-5"><div className="flex flex-wrap items-center gap-3"><span className="avatar-fold h-[52px] w-[52px] text-xl">{thread.author.split(" ").at(-1)?.[0]}</span><div><strong>{thread.author}</strong><span className="block text-xs text-[#7A5A48]">Nhân vật minh hoạ · {thread.time}</span></div><span className="ml-auto bg-[#E5D6C2] px-3 py-1 text-xs font-semibold">{thread.category}</span></div><h1 className="paper-title text-[clamp(32px,4vw,46px)]">{thread.title}</h1><p className="m-0 text-lg leading-[1.75] text-[#4E3326]">{thread.body}</p><div className="flex flex-wrap gap-2 border-t border-dashed border-[#D2BE9C] pt-5"><Link href={actionHref} className="paper-button paper-button-secondary">{actionLabel}</Link></div></div></article>
    {thread.sampleReplies.length > 0 && <section aria-labelledby="replies-heading"><h2 id="replies-heading" className="serif mb-6 text-2xl font-medium">Phản hồi minh hoạ</h2><div className="reply-list">{thread.sampleReplies.map((reply,index) => <article key={`${reply.author}-${index}`} className="reply-card paper-grain" style={{ transform: `rotate(${[-.4,.3,-.2,.4][index]}deg)`, backgroundColor: index % 2 ? "#F3EBDD" : "#FBF8F2" }}><div className="mb-3 flex items-center gap-3"><span className="avatar-fold h-10 w-10">{reply.author.split(" ").at(-1)?.[0]}</span><strong className="text-sm">{reply.author}</strong><span className="text-xs text-[#7A5A48]">· {reply.time}</span></div><p className="m-0 leading-relaxed text-[#4E3326]">{reply.body}</p></article>)}</div></section>}
    <section className="paper-sheet paper-grain p-8"><h2 className="serif mt-0 text-2xl font-medium">Viết phản hồi thật</h2><p className="text-[#6E4D3C]">Phản hồi thật được đăng trong cộng đồng riêng tư để bảo vệ cuộc trò chuyện và danh tính thành viên.</p><Link href={actionHref} className="paper-button paper-button-primary mt-3">{actionLabel}</Link></section>
    <Link href="/forum" className="self-start font-semibold no-underline">← Quay lại Forum</Link>
  </main></div>;
}
