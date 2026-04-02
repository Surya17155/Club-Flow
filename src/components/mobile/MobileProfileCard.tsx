import { memo } from "react";
import { Instagram, Linkedin, Mail } from "lucide-react";
import VerifiedBadge, { getRoleBadgeVariant } from "@/components/ui/VerifiedBadge";

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

export const MobileProfileCard = memo(function MobileProfileCard({
  fullName, roleLabel, clubName, avatarUrl, programme, year, about,
  isPersonal, viewMode = "personal", socialLinkedin, socialInstagram, socialGmail, role,
}: MobileProfileCardProps) {
  const initials = fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const hasSocials = socialLinkedin || socialInstagram || socialGmail;

  return (
    <div
      className="overflow-hidden"
      style={{
        background: '#F6E1CF',
        border: '2px solid #111',
        boxShadow: '6px 6px 0px #111',
      }}
    >
      {/* Image */}
      <div className="w-full" style={{ aspectRatio: '4/5', borderBottom: '2px solid #111' }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(0.3) contrast(1.1)' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: '#E98A3A' }}
          >
            <span className="text-6xl font-black" style={{ color: '#111' }}>{initials}</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-5">
        <h2
          className="text-3xl font-black uppercase leading-none flex items-center gap-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
        >
          {fullName}
          {role && getRoleBadgeVariant(role) && (
            <VerifiedBadge variant={getRoleBadgeVariant(role)!} size={20} />
          )}
        </h2>

        {/* Role Badge */}
        <div className="mt-2">
          <span
            className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest"
            style={{
              background: '#111',
              color: '#E98A3A',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {isPersonal ? 'Student' : `${roleLabel}`}
          </span>
        </div>

        {/* Info */}
        <p
          className="mt-4 text-sm leading-relaxed"
          style={{ color: '#333', fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {[programme, year ? `${year} Year` : null, about].filter(Boolean).join(' • ') || 'No details available'}
        </p>

        {/* Social Icons */}
        {hasSocials && (
          <div className="flex gap-3 mt-5">
            {socialInstagram && (
              <a
                href={socialInstagram.startsWith('http') ? socialInstagram : `https://${socialInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                style={{
                  background: '#fff',
                  border: '2px solid #111',
                  boxShadow: '2px 2px 0px #111',
                }}
              >
                <Instagram className="w-4 h-4" style={{ color: '#111' }} />
              </a>
            )}
            {socialLinkedin && (
              <a
                href={socialLinkedin.startsWith('http') ? socialLinkedin : `https://${socialLinkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                style={{
                  background: '#fff',
                  border: '2px solid #111',
                  boxShadow: '2px 2px 0px #111',
                }}
              >
                <Linkedin className="w-4 h-4" style={{ color: '#111' }} />
              </a>
            )}
            {socialGmail && (
              <a
                href={`mailto:${socialGmail}`}
                className="w-10 h-10 flex items-center justify-center cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                style={{
                  background: '#fff',
                  border: '2px solid #111',
                  boxShadow: '2px 2px 0px #111',
                }}
              >
                <Mail className="w-4 h-4" style={{ color: '#111' }} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
