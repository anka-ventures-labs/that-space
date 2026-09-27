"use client";

import { useState } from "react";
import { matchmakingProfiles, type MatchmakingProfile } from "@/lib/matchmaking-data";

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-xl ${i < stars ? "text-[#C4A882]" : "text-[#C4A882]/25"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function MatchmakingPage() {
  const [selectedProfile, setSelectedProfile] = useState<MatchmakingProfile | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C4A882]/20 mb-4">
          <span className="text-3xl">💫</span>
        </div>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl text-[#5C3D2E] font-bold mb-4">
          Tìm Duyên — Spiritual Matchmaking
        </h1>
        <p className="text-[#5C3D2E]/70 max-w-2xl mx-auto leading-relaxed mb-3">
          At Thật Space, we believe true connection goes beyond surface compatibility. Our
          matchmaking is guided by the ancient wisdom of Tử Vi — Vietnamese astrology — to reveal
          soul-level resonance between you and your potential match.
        </p>
        <p className="text-[#5C3D2E]/60 max-w-xl mx-auto leading-relaxed text-sm">
          Each compatibility reading examines your birth charts, elemental energies, and spiritual
          pathways to illuminate the depth and potential of every connection you explore.
        </p>
      </div>

      {/* Profile Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchmakingProfiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white/60 border border-[#C4A882]/30 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg hover:border-[#C4A882] transition-all duration-300"
          >
            {/* Avatar circle with initials */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-[#5C3D2E] flex-shrink-0 shadow-sm"
                style={{ backgroundColor: profile.avatarColor }}
              >
                {profile.initials}
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] font-semibold text-[#5C3D2E] text-lg leading-tight">
                  {profile.name}
                </h3>
                <p className="text-xs text-[#C4A882] mt-0.5">{profile.sign}</p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-[#5C3D2E]/75 leading-relaxed flex-1 line-clamp-2">
              {profile.bio}
            </p>

            {/* CTA */}
            <button
              onClick={() => setSelectedProfile(profile)}
              className="w-full bg-[#5C3D2E] text-[#F5F0E8] py-2.5 rounded-full text-sm font-medium hover:bg-[#C4A882] hover:text-[#5C3D2E] transition-colors"
            >
              View Compatibility
            </button>
          </div>
        ))}
      </div>

      {/* Compatibility Modal */}
      {selectedProfile && (
        <div
          className="fixed inset-0 bg-[#5C3D2E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProfile(null);
          }}
        >
          <div className="bg-[#F5F0E8] rounded-3xl max-w-lg w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Profile header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-[#5C3D2E] flex-shrink-0 shadow-md"
                style={{ backgroundColor: selectedProfile.avatarColor }}
              >
                {selectedProfile.initials}
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#5C3D2E]">
                  {selectedProfile.name}
                </h2>
                <p className="text-[#C4A882] text-sm">{selectedProfile.sign}</p>
              </div>
            </div>

            {/* Match score */}
            <div className="text-center bg-gradient-to-r from-[#5C3D2E] to-[#7a5240] rounded-2xl p-6 mb-6">
              <p className="text-[#C4A882] text-sm mb-1">Overall Match Score</p>
              <p className="text-[#F5F0E8] text-5xl font-bold font-[family-name:var(--font-playfair)]">
                {selectedProfile.compatibility.score}% Compatible
              </p>
            </div>

            {/* Star rating breakdown */}
            <div className="space-y-4 mb-6">
              {selectedProfile.compatibility.details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between">
                  <span className="text-sm text-[#5C3D2E] font-medium w-32">{detail.label}</span>
                  <StarRating stars={detail.stars} />
                </div>
              ))}
            </div>

            {/* Compatibility description */}
            <div className="bg-white/60 rounded-xl p-5 border border-[#C4A882]/30 mb-6">
              <p className="text-sm text-[#5C3D2E]/80 leading-relaxed">
                {selectedProfile.compatibility.description}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedProfile(null)}
              className="w-full border-2 border-[#5C3D2E] text-[#5C3D2E] py-2.5 rounded-full text-sm font-medium hover:bg-[#5C3D2E] hover:text-[#F5F0E8] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
