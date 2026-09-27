import Link from "next/link";

const member = {
  name: "Nguyễn Thị Lan",
  initials: "NT",
  avatarColor: "#C4A882",
  sign: "♓ Song Ngư",
  joinDate: "Tháng 1, 2024",
  bio: "Kỹ sư phần mềm với tình yêu Tử Vi và thiên văn học. Mình tin rằng sự hiểu biết nội tâm là nền tảng của mọi kết nối đích thực. Đang trên hành trình khám phá bản thân và tìm kiếm những người bạn đồng hành chân thành.",
};

const readings = [
  {
    id: 1,
    date: "15 tháng 1, 2024",
    title: "Tháng 1 — Tử Vi Reading",
    excerpt:
      "Năm Giáp Thìn mang đến những chuyển biến sâu sắc trong tình cảm và sự nghiệp. Đây là thời điểm tốt để khởi đầu những dự án mới và nuôi dưỡng các mối quan hệ ý nghĩa.",
  },
  {
    id: 2,
    date: "10 tháng 11, 2023",
    title: "Tháng 11 — Tử Vi Reading",
    excerpt:
      "Tháng 11 là giai đoạn của sự chữa lành và tái tạo nội tâm. Những người thuộc cung Song Ngư sẽ cảm nhận được sức mạnh tâm linh tăng trưởng rõ rệt trong giai đoạn này.",
  },
];

const myMatches = [
  {
    id: 1,
    name: "Trần Minh Châu",
    initials: "MC",
    avatarColor: "#E8C5B0",
    sign: "♈ Aries",
    score: 92,
  },
  {
    id: 2,
    name: "Nguyễn Bảo Anh",
    initials: "BA",
    avatarColor: "#D4B8A8",
    sign: "♎ Libra",
    score: 87,
  },
  {
    id: 3,
    name: "Võ Thanh Thảo",
    initials: "TT",
    avatarColor: "#A8C5A0",
    sign: "♉ Taurus",
    score: 85,
  },
];

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile Header */}
      <div className="bg-white/60 border border-[#C4A882]/30 rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
              style={{ backgroundColor: member.avatarColor }}
            >
              {member.initials}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-bold text-[#5C3D2E]">
              {member.name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="text-sm text-[#5C3D2E]/70">{member.sign}</span>
              <span className="text-sm text-[#5C3D2E]/70">
                Gia nhập {member.joinDate}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#5C3D2E]/80 leading-relaxed max-w-lg">
              {member.bio}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* My Readings Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#5C3D2E]">
              My Readings
            </h2>
            <Link
              href="/tuvi"
              className="text-sm text-[#C4A882] hover:text-[#5C3D2E] transition-colors"
            >
              + New Reading
            </Link>
          </div>

          <div className="space-y-4">
            {readings.map((reading) => (
              <Link
                key={reading.id}
                href="/tuvi"
                className="block bg-white/60 border border-[#C4A882]/30 rounded-2xl p-5 hover:shadow-md hover:border-[#C4A882] transition-all"
              >
                <p className="text-xs text-[#5C3D2E]/50 mb-1">{reading.date}</p>
                <p className="font-[family-name:var(--font-playfair)] font-semibold text-[#5C3D2E] mb-2">
                  {reading.title}
                </p>
                <p className="text-sm text-[#5C3D2E]/70 leading-relaxed">
                  {reading.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* My Matches Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#5C3D2E]">
              My Matches
            </h2>
            <Link
              href="/matchmaking"
              className="text-sm text-[#C4A882] hover:text-[#5C3D2E] transition-colors"
            >
              Explore More
            </Link>
          </div>

          <div className="space-y-3">
            {myMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white/60 border border-[#C4A882]/30 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md hover:border-[#C4A882] transition-all"
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: match.avatarColor }}
                >
                  {match.initials}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium text-[#5C3D2E] text-sm">{match.name}</p>
                  <p className="text-xs text-[#5C3D2E]/60">{match.sign}</p>
                </div>

                {/* Score + Button */}
                <div className="flex flex-col items-end gap-1">
                  <p className="font-[family-name:var(--font-playfair)] font-bold text-[#5C3D2E] text-lg">
                    {match.score}%
                  </p>
                  <Link
                    href="/matchmaking"
                    className="text-xs bg-[#5C3D2E] text-[#F5F0E8] px-3 py-1 rounded-full hover:bg-[#C4A882] transition-colors"
                  >
                    View Match
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
