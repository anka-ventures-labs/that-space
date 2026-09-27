export interface CompatibilityDetail {
  label: string;
  stars: number;
}

export interface CompatibilityData {
  score: number;
  details: CompatibilityDetail[];
  description: string;
}

export interface MatchmakingProfile {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  sign: string;
  bio: string;
  compatibility: CompatibilityData;
}

export const matchmakingProfiles: MatchmakingProfile[] = [
  {
    id: 1,
    name: "Trần Minh Châu",
    initials: "MC",
    avatarColor: "#E8C5B0",
    sign: "♈ Aries",
    bio: "Yêu thiên nhiên, thiền định và sách triết học. Tìm kiếm kết nối tâm hồn chân thành qua những buổi trò chuyện sâu.",
    compatibility: {
      score: 92,
      details: [
        { label: "Love", stars: 5 },
        { label: "Communication", stars: 5 },
        { label: "Spirituality", stars: 4 },
      ],
      description:
        "A rare and beautiful alignment — Aries and your chart resonate at a soul level. Châu brings passion and boldness while you bring depth and grounding. Together you create a bond that is both fiery and enduring.",
    },
  },
  {
    id: 2,
    name: "Lê Phương Linh",
    initials: "PL",
    avatarColor: "#C4A882",
    sign: "♊ Gemini",
    bio: "Writer, dreamer, người đi tìm vẻ đẹp trong từng khoảnh khắc nhỏ. Thích poetry và những buổi sáng bình yên.",
    compatibility: {
      score: 78,
      details: [
        { label: "Love", stars: 4 },
        { label: "Communication", stars: 5 },
        { label: "Spirituality", stars: 3 },
      ],
      description:
        "Linh and you share an exceptional intellectual bond — conversations will never run dry. Gemini brings creativity and adaptability. A deeply enriching connection that blossoms with time and trust.",
    },
  },
  {
    id: 3,
    name: "Võ Thanh Thảo",
    initials: "TT",
    avatarColor: "#A8C5A0",
    sign: "♉ Taurus",
    bio: "Bếp núc, vườn cây và âm nhạc dân gian là thế giới của mình. Tin vào sức mạnh của sự kiên nhẫn và tình yêu đích thực.",
    compatibility: {
      score: 85,
      details: [
        { label: "Love", stars: 4 },
        { label: "Communication", stars: 4 },
        { label: "Spirituality", stars: 5 },
      ],
      description:
        "Taurus and you share deeply aligned core values — authenticity, stability, and the beauty of simple living. Thảo brings warmth and a sense of safety that is rare and precious.",
    },
  },
  {
    id: 4,
    name: "Nguyễn Bảo Anh",
    initials: "BA",
    avatarColor: "#D4B8A8",
    sign: "♎ Libra",
    bio: "Luật sư ban ngày, nghệ sĩ ban đêm. Tin rằng cuộc sống đẹp nhất khi có sự cân bằng giữa lý trí và cảm xúc.",
    compatibility: {
      score: 87,
      details: [
        { label: "Love", stars: 4 },
        { label: "Communication", stars: 5 },
        { label: "Spirituality", stars: 4 },
      ],
      description:
        "Libra and you create perfect balance. Bảo Anh brings fairness, aesthetic sensibility, and extraordinary listening skills. A connection full of mutual growth and shared inspiration.",
    },
  },
  {
    id: 5,
    name: "Đỗ Kiều Trang",
    initials: "KT",
    avatarColor: "#B8C5D8",
    sign: "♏ Scorpio",
    bio: "Bác sĩ tâm lý với tấm lòng nhân hậu. Tìm kiếm kết nối thực sự và những người không sợ nhìn thẳng vào cảm xúc.",
    compatibility: {
      score: 74,
      details: [
        { label: "Love", stars: 4 },
        { label: "Communication", stars: 3 },
        { label: "Spirituality", stars: 5 },
      ],
      description:
        "Scorpio and you share a profound spiritual connection. Trang has the gift of seeing what others hide — both fascinating and challenging. This bond demands courage and absolute authenticity.",
    },
  },
  {
    id: 6,
    name: "Huỳnh Ngọc Trân",
    initials: "NT",
    avatarColor: "#C5D4C0",
    sign: "♑ Capricorn",
    bio: "Startup founder với tâm hồn nghệ sĩ. Thích leo núi, viết nhật ký và những cuộc trò chuyện bên bếp lửa dưới bầu trời đêm.",
    compatibility: {
      score: 81,
      details: [
        { label: "Love", stars: 4 },
        { label: "Communication", stars: 4 },
        { label: "Spirituality", stars: 4 },
      ],
      description:
        "Capricorn and you have mutual respect woven into your charts. Trân brings vision, dedication, and a quietly loyal heart. A wonderful foundation for a deep and lasting connection.",
    },
  },
];
