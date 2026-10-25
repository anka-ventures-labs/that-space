"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { matchmakingProfiles } from "@/lib/origami-data";

const avatarTones = [["#DCCAAE","#C4A882","#3F2A1F"],["#5C3D2E","#4E3326","#F5F0E8"],["#E2D4BC","#D2BE9C","#3F2A1F"],["#A88B66","#8A6450","#FBF8F2"],["#F3EBDD","#E2D4BC","#5C3D2E"],["#7A5442","#5C3D2E","#F5F0E8"]];

export default function MatchmakingGallery({ joinHref }: { joinHref: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const profile = selected === null ? null : matchmakingProfiles[selected];
  useEffect(() => {
    if (selected === null) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; triggerRef.current?.focus(); };
  }, [selected]);
  return <>
    <div className="match-grid">{matchmakingProfiles.map((item,index) => <article key={item.id} className="fold-card paper-sheet paper-grain flex min-h-[390px] flex-col gap-5 p-8"><div className="flex items-center gap-4"><span className="avatar-fold h-16 w-16 text-xl" style={{ background: `linear-gradient(135deg,${avatarTones[index][0]} 50%,${avatarTones[index][1]} 50%)`, color: avatarTones[index][2] }}>{item.initials}</span><div><h2 className="serif m-0 text-2xl font-medium">{item.name}</h2><span className="text-sm font-semibold text-[#7A5A48]">{item.sign}</span></div><span className="score-seal serif ml-auto h-14 w-14 text-lg">{item.score}</span></div><p className="m-0 flex-1 leading-relaxed text-[#6E4D3C]">{item.bio}</p><button type="button" className="paper-button paper-button-secondary" onClick={(event) => { triggerRef.current = event.currentTarget; setSelected(index); }}>View Compatibility</button></article>)}</div>
    {profile && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section ref={dialogRef} className="modal-letter paper-grain unfold" role="dialog" aria-modal="true" aria-labelledby="match-title"><button ref={closeRef} type="button" aria-label="Close" onClick={() => setSelected(null)} className="absolute right-3 top-3 grid h-11 w-11 place-items-center border-0 bg-transparent text-2xl text-[#5C3D2E]">×</button><div className="flex items-center gap-4"><span className="avatar-fold h-16 w-16 text-xl">{profile.initials}</span><div><h2 id="match-title" className="serif m-0 text-3xl font-medium">{profile.name}</h2><span className="text-sm font-semibold text-[#7A5A48]">{profile.sign}</span></div></div><div className="my-6 flex items-center gap-5 bg-[#5C3D2E] p-5 text-[#F5F0E8]"><span className="score-seal serif text-3xl font-semibold">{profile.score}</span><div><span className="eyebrow !text-[#C4A882]">Illustrative match score</span><strong className="serif block text-2xl font-medium">{profile.score}% · Sample</strong></div></div><div>{profile.details.map(([label,stars]) => <div key={label} className="flex items-center justify-between border-b border-dashed border-[#E2D4BC] py-3"><strong className="font-medium">{label}</strong><span role="img" aria-label={`${stars} of 5`} className="tracking-[.3em] text-[#A88B66]">{"✦".repeat(stars)}<span className="opacity-30">{"✦".repeat(5-stars)}</span></span></div>)}</div><p className="my-6 leading-relaxed text-[#4E3326]">{profile.description}</p><p className="text-xs leading-relaxed text-[#7A5A48]">Điểm và hồ sơ trên trang công khai là bản minh hoạ thiết kế, không phải thành viên thật hoặc kết quả ghép đôi thật.</p><Link href={joinHref} className="paper-button paper-button-primary mt-3 w-full">Trò chuyện riêng với Bà Mối</Link></section></div>}
  </>;
}
