"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Motion = { rx: number; ry: number; tx: number; ty: number; lx: number; ly: number; px: number; py: number; open: number };
type Petal = { w: number; l: number; cup: number; openBy: number; rot: number; z: number; a: string; b: string; cl: number; sl: number; cr: number; sr: number };

function buildPetals(): Petal[] {
  const layers = [
    { n: 8, w: 120, l: 180, cup: 16, openBy: 12, off: 0, z: 0, a: "#B39672", b: "#937552" },
    { n: 8, w: 106, l: 152, cup: 36, openBy: 22, off: 22.5, z: 6, a: "#D6C2A0", b: "#BFA27A" },
    { n: 8, w: 86, l: 120, cup: 56, openBy: 30, off: 0, z: 12, a: "#F3EBDD", b: "#DDCDB2" },
    { n: 5, w: 64, l: 86, cup: 72, openBy: 36, off: 36, z: 20, a: "#FBF8F2", b: "#E8DCC6" },
  ];
  const k = .16;
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return layers.flatMap((layer) => Array.from({ length: layer.n }, (_, i) => {
    const rot = layer.off + (360 / layer.n) * i;
    const left = (rot - 55) * Math.PI / 180;
    const right = (rot + 55) * Math.PI / 180;
    return { ...layer, rot, cl: round(Math.cos(left) * k), sl: round(Math.sin(left) * k), cr: round(Math.cos(right) * k), sr: round(Math.sin(right) * k) };
  }));
}

function Crane({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={`crane ${className}`} style={style} width="96" height="64" viewBox="0 0 120 80" aria-hidden="true">
      <polygon points="52,44 74,2 66,46" fill="#A88B66" /><polygon points="8,26 42,44 34,50" fill="#8A6450" />
      <polygon points="34,50 60,40 80,52 54,62" fill="#C4A882" /><polygon points="34,50 54,62 60,40" fill="#B39672" />
      <polygon points="44,46 26,4 64,44" fill="#DCCAAE" /><polygon points="74,48 104,14 82,52" fill="#A88B66" />
      <polygon points="104,14 116,22 106,20" fill="#5C3D2E" />
    </svg>
  );
}

export default function OrigamiLotus({ signupHref, loginHref, registrationOpen }: { signupHref: string; loginHref?: string; registrationOpen: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const current = useRef<Motion>({ rx: 4, ry: 0, tx: 0, ty: 0, lx: 0, ly: -.4, px: 0, py: 0, open: 0 });
  const target = useRef<Motion>({ ...current.current });
  const lastMove = useRef(0);
  const openTarget = useRef(0);
  const [bloomed, setBloomed] = useState(false);
  const petals = useMemo(buildPetals, []);

  useEffect(() => {
    let frame = 0;
    if (typeof window.requestAnimationFrame !== "function") return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;
      const idle = now - lastMove.current > 2200;
      if (idle && !reduce) {
        const s = Math.sin(now / 1900), c = Math.sin(now / 2600);
        Object.assign(target.current, { ry: s * 12, rx: 4 + c * 5, tx: s * 6, ty: 0, lx: s * .6, ly: -.5 + c * .2, px: s * .2, py: c * .15 });
      } else if (idle) {
        Object.assign(target.current, { ry: 0, rx: 4, tx: 0, ty: 0, lx: 0, ly: -.4, px: 0, py: 0 });
      }
      target.current.open = openTarget.current;
      const ease = reduce ? .3 : .075;
      (Object.keys(current.current) as (keyof Motion)[]).forEach((key) => {
        current.current[key] += (target.current[key] - current.current[key]) * (key === "open" ? .05 : ease);
      });
      const el = heroRef.current;
      if (el) {
        const c = current.current;
        el.style.setProperty("--rx", `${c.rx.toFixed(2)}deg`); el.style.setProperty("--ry", `${c.ry.toFixed(2)}deg`);
        el.style.setProperty("--tx", `${c.tx.toFixed(2)}px`); el.style.setProperty("--ty", `${c.ty.toFixed(2)}px`);
        el.style.setProperty("--stem", `${(Math.atan2(c.tx, 400) * 57.3).toFixed(2)}deg`);
        el.style.setProperty("--lx", c.lx.toFixed(3)); el.style.setProperty("--ly", c.ly.toFixed(3));
        el.style.setProperty("--px", c.px.toFixed(3)); el.style.setProperty("--py", c.py.toFixed(3)); el.style.setProperty("--open", c.open.toFixed(3));
      }
      frame = window.requestAnimationFrame(tick);
    };
    const start = () => { if (!frame && visible) frame = window.requestAnimationFrame(tick); };
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && document.visibilityState === "visible";
      if (visible) start(); else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
    }, { rootMargin: "160px" }) : null;
    if (heroRef.current) observer?.observe(heroRef.current);
    const onVisibility = () => { visible = document.visibilityState === "visible"; if (visible) start(); else if (frame) { window.cancelAnimationFrame(frame); frame = 0; } };
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => { if (frame) window.cancelAnimationFrame(frame); observer?.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  function onMove(event: React.PointerEvent<HTMLElement>) {
    const stage = stageRef.current, hero = heroRef.current;
    if (!stage || !hero) return;
    const rect = stage.getBoundingClientRect(), bounds = hero.getBoundingClientRect();
    const clamp = (value: number) => Math.max(-1, Math.min(1, value));
    const dx = clamp((event.clientX - (rect.left + rect.width / 2)) / Math.max(320, bounds.width * .5));
    const dy = clamp((event.clientY - (rect.top + rect.height * .4)) / Math.max(260, bounds.height * .6));
    Object.assign(target.current, { ry: dx * 40, rx: -dy * 32, tx: dx * 22, ty: dy * 12, lx: dx, ly: dy, px: clamp((event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2)), py: clamp((event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2)) });
    lastMove.current = performance.now();
  }

  return (
    <section ref={heroRef} className="origami-hero" onPointerMove={onMove} onPointerLeave={() => { lastMove.current = 0; }}>
      <div className="hero-crease" aria-hidden="true" />
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow inline-flex items-center gap-2 bg-[#FBF8F2] px-4 py-2 shadow-sm"><span aria-hidden="true">◇</span> Không gian thật · dành cho người trưởng thành</p>
          <h1 lang="en" className="paper-title mt-7 text-[clamp(44px,6vw,80px)]">A private space to <em className="text-[#8A6450]">connect, grow,</em> and discover.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#6E4D3C]">Nơi trí tuệ Việt gặp những kết nối hiện đại, chân thành và có chủ đích.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href={signupHref} className="paper-button paper-button-primary px-8">{registrationOpen ? "Tham gia Thật Space" : "Liên hệ Thật Space"}</Link><Link href="/tuvi" className="paper-button paper-button-secondary px-7">Get Your Reading</Link>{loginHref && <Link href={loginHref} className="paper-button px-4">Đăng nhập thành viên</Link>}</div>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#6E4D3C]">Bất kỳ ai từ đủ 18 tuổi đều có thể tham gia, không phân biệt giới tính. Câu trả lời đăng ký không tự động được dùng cho mai mối. <Link href="/privacy" className="font-semibold underline underline-offset-4">Quyền riêng tư</Link></p>
          <p className="mt-7 text-sm text-[#7A5A48]">Move your cursor — the lotus turns to find you. Tap it to {bloomed ? "fold" : "bloom"}.</p>
        </div>
        <div ref={stageRef} className="lotus-stage">
          <div className="paper-moon" aria-hidden="true" />
          <Crane style={{ position: "absolute", left: "6%", top: 40, transform: "translate(calc(var(--px) * 40px),calc(var(--py) * 30px))" }} />
          <Crane style={{ position: "absolute", right: "4%", top: 150, transform: "translate(calc(var(--px) * 56px),calc(var(--py) * 40px)) scale(-.7,.7)", animationDuration: "12s" }} />
          <Crane style={{ position: "absolute", right: "18%", bottom: 36, transform: "translate(calc(var(--px) * 24px),calc(var(--py) * 18px)) scale(.5)", animationDuration: "10s" }} />
          <div className="lotus-stem" aria-hidden="true"><span className="lotus-leaf lotus-leaf-a" /><span className="lotus-leaf lotus-leaf-b" /></div>
          <button className="lotus-head" type="button" aria-label="Hoa sen origami" aria-pressed={bloomed} onClick={() => { openTarget.current = openTarget.current ? 0 : 1; setBloomed(Boolean(openTarget.current)); }}>
            {petals.map((petal, index) => (
              <span key={index} className="lotus-petal" style={{ width: petal.w, height: petal.l, marginLeft: -petal.w / 2, marginTop: -petal.l, transform: `rotate(${petal.rot}deg) translateZ(${petal.z}px) rotateX(calc(-1deg * (${petal.cup} - var(--open) * ${petal.openBy})))` }}>
                <span className="lotus-half lotus-half-left" style={{ backgroundColor: petal.a, filter: `brightness(calc(1 + var(--lx) * ${petal.cl} + var(--ly) * ${petal.sl}))` }} />
                <span className="lotus-half lotus-half-right" style={{ backgroundColor: petal.b, filter: `brightness(calc(1 + var(--lx) * ${petal.cr} + var(--ly) * ${petal.sr}))` }} />
              </span>
            ))}
            <span className="lotus-pod" />
          </button>
          <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-[18px] w-[280px] -translate-x-1/2 rounded-[50%] bg-[#3F2A1F]/15" />
        </div>
      </div>
    </section>
  );
}
