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
}

export function MobileProfileCard({
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

      {/* Layer 2: Blur / Gradient Overlay */}
      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: "35%",
          zIndex: 2,
          borderRadius: "0 0 28px 28px",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0) 100%)",
          maskImage: "linear-gradient(to top, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 70%, transparent 100%)",
        }}
      />

      {/* Layer 3: Content Layer */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 pb-5 flex flex-col justify-end"
        style={{ zIndex: 3, height: "45%" }}
      >
        {/* Name */}
        <h2 className="text-xl font-bold font-display text-white drop-shadow-md">{fullName}</h2>

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
}
