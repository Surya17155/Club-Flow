import { memo } from "react";
import { Instagram, Linkedin, Mail } from "lucide-react";

interface MobileProfileCardProps {
  fullName: string;
  roleLabel: string;
  clubName?: string;
  avatarUrl?: string;
  programme?: string;
  year?: string;
  about?: string;
  isPersonal?: boolean;
  viewMode?: "personal" | "club";
  socialLinkedin?: string;
  socialInstagram?: string;
  socialGmail?: string;
  role?: string;
}

import VerifiedBadge, { getRoleBadgeVariant } from "@/components/ui/VerifiedBadge";

export const MobileProfileCard = memo(function MobileProfileCard({
  fullName,
  roleLabel,
  clubName,
  avatarUrl,
  programme,
  year,
  about,
  isPersonal,
  viewMode = "personal",
  socialLinkedin,
  socialInstagram,
  socialGmail,
  role,
}: MobileProfileCardProps) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasSocials = socialLinkedin || socialInstagram || socialGmail;

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: "100%",
        maxWidth: "320px",
        aspectRatio: "3 / 4",
        borderRadius: "28px",
        background: "#111",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.25)",
      }}
    >
      {/* Layer 1: Profile Image */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center", zIndex: 1 }}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center text-5xl font-bold text-white"
          style={{
            background: "linear-gradient(145deg, hsl(30 60% 78%), hsl(36 55% 72%), hsl(25 50% 68%))",
            zIndex: 1,
          }}
        >
          {initials}
        </div>
      )}

      {/* Layer 2: Smooth Progressive Blur */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: "60%",
          zIndex: 2,
          borderRadius: "0 0 28px 28px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.08) 60%, rgba(0,0,0,0.02) 75%, rgba(0,0,0,0) 90%)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0) 90%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 20%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0) 90%)",
        }}
      />

      {/* Layer 3: Content Layer */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 pb-5 flex flex-col justify-end"
        style={{ zIndex: 3, height: "35%" }}
      >
        {/* Name */}
        <h2 className="text-xl font-bold font-display text-white drop-shadow-md flex items-center">
          {fullName}
          {role && getRoleBadgeVariant(role) && (
            <VerifiedBadge variant={getRoleBadgeVariant(role)!} size={18} />
          )}
        </h2>

        {/* Role */}
        <p className="text-sm font-medium text-white/75 mt-0.5">
          {isPersonal ? "Student" : `${roleLabel} • ${clubName}`}
        </p>

        {/* Programme & Year */}
        {(programme || year) && (
          <div className="flex gap-4 mt-2 text-xs text-white/60">
            {year && <span>{year}</span>}
            {programme && <span>{programme}</span>}
          </div>
        )}

        {/* Social icons — below programme/year */}
        {hasSocials && (
          <div className="flex gap-3 mt-3">
            {socialLinkedin && (
              <a
                href={socialLinkedin.startsWith("http") ? socialLinkedin : `https://${socialLinkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-white" />
              </a>
            )}
            {socialInstagram && (
              <a
                href={socialInstagram.startsWith("http") ? socialInstagram : `https://${socialInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>
            )}
            {socialGmail && (
              <a
                href={`mailto:${socialGmail}`}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <Mail className="w-4 h-4 text-white" />
              </a>
            )}
          </div>
        )}

        {/* About */}
        {about && <p className="text-xs text-white/55 mt-2 line-clamp-2 leading-relaxed">{about}</p>}
      </div>
    </div>
  );
});
