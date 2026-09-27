import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: (
      <svg className="w-10 h-10 text-[#C4A882]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    title: "Forum",
    description: "Connect with sisters who understand your journey. Share stories, seek wisdom, and find your tribe in our warm community spaces.",
    href: "/forum",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-[#C4A882]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: "Tử Vi Horoscope",
    description: "Receive deeply personal Tử Vi readings rooted in ancient Vietnamese astrology. Discover insights into love, career, and spiritual path.",
    href: "/tuvi",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-[#C4A882]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Matchmaking",
    description: "Find your spiritual companion through our compatibility system. We blend Tử Vi wisdom with modern connection to help you discover meaningful bonds.",
    href: "/matchmaking",
  },
];

const testimonials = [
  {
    name: "Nguyễn Thanh Hà",
    role: "Hà Nội",
    quote: "Thật Space gave me a place to truly be myself. The women here understand depths of life I never thought I could talk about openly.",
  },
  {
    name: "Trần Minh Châu",
    role: "TP. Hồ Chí Minh",
    quote: "My Tử Vi reading was so accurate it brought me to tears. This platform honours our Vietnamese roots while making me feel seen and supported.",
  },
  {
    name: "Lê Phương Linh",
    role: "Đà Nẵng",
    quote: "I found my closest friend through Thật Space. We matched on so many spiritual levels — it felt written in the stars.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#F5F0E8] to-[#EDE6D8] py-24 px-4 text-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-[#C4A882]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-[#C4A882]/10 blur-3xl" />

        <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#C4A882]/20 scale-110 blur-xl" />
            <Image
              src="/logo.jpg"
              alt="Thật Space"
              width={120}
              height={120}
              className="relative rounded-full border-4 border-[#C4A882] shadow-xl object-cover"
              priority
            />
          </div>

          <div className="space-y-4">
            <p className="font-[family-name:var(--font-playfair)] text-4xl md:text-6xl font-bold text-[#5C3D2E] leading-tight">
              Thật Space
            </p>
            <h1 className="text-lg md:text-xl text-[#5C3D2E]/80 max-w-xl mx-auto leading-relaxed font-[family-name:var(--font-playfair)]">
              A private space for women to connect, grow, and discover
            </h1>
            <p className="text-sm md:text-base text-[#C4A882] max-w-md mx-auto">
              Where Vietnamese wisdom meets modern sisterhood
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/forum"
              className="bg-[#5C3D2E] text-[#F5F0E8] px-8 py-3 rounded-full font-medium hover:bg-[#C4A882] transition-all duration-300 shadow-md hover:shadow-lg text-center"
            >
              Join the Community
            </Link>
            <Link
              href="/tuvi"
              className="border-2 border-[#5C3D2E] text-[#5C3D2E] px-8 py-3 rounded-full font-medium hover:bg-[#5C3D2E] hover:text-[#F5F0E8] transition-all duration-300 text-center"
            >
              Get Your Reading
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#5C3D2E] font-bold mb-3">
            Everything You Need to Flourish
          </h2>
          <p className="text-[#5C3D2E]/70 max-w-lg mx-auto">
            Three pillars of connection, wisdom, and belonging — crafted for the modern Vietnamese woman.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="bg-white/60 backdrop-blur-sm border border-[#C4A882]/30 rounded-2xl p-8 flex flex-col items-center text-center gap-4 hover:shadow-lg hover:border-[#C4A882] transition-all duration-300 group"
            >
              <div className="p-4 bg-[#F5F0E8] rounded-full group-hover:bg-[#C4A882]/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#5C3D2E]">
                {feature.title}
              </h3>
              <p className="text-[#5C3D2E]/70 text-sm leading-relaxed">
                {feature.description}
              </p>
              <span className="text-[#C4A882] text-sm font-medium group-hover:text-[#5C3D2E] transition-colors">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#5C3D2E]/5 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#5C3D2E] font-bold mb-3">
              Voices from Our Sisters
            </h2>
            <div className="w-16 h-1 bg-[#C4A882] mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white/80 rounded-2xl p-8 border border-[#C4A882]/20 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#C4A882]/40 flex items-center justify-center text-[#5C3D2E] font-semibold text-lg">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#5C3D2E] text-sm">{t.name}</p>
                    <p className="text-[#C4A882] text-xs">{t.role}</p>
                  </div>
                </div>
                <p className="text-[#5C3D2E]/80 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-[#C4A882] text-sm">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#5C3D2E] font-bold">
            Ready to Find Your Space?
          </h2>
          <p className="text-[#5C3D2E]/70 leading-relaxed">
            Join thousands of Vietnamese women who have discovered deeper connection, ancient wisdom, and meaningful friendship in Thật Space.
          </p>
          <Link
            href="/forum"
            className="inline-block bg-[#5C3D2E] text-[#F5F0E8] px-10 py-4 rounded-full font-medium text-lg hover:bg-[#C4A882] transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Join the Community — It&apos;s Free
          </Link>
        </div>
      </section>
    </div>
  );
}
