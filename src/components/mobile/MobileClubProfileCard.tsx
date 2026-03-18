import { Badge } from '@/components/ui/badge';
import { Instagram, Linkedin } from 'lucide-react';

interface MobileClubProfileCardProps {
  clubName: string;
  clubLogo?: string | null;
  clubAbout?: string | null;
  postHolders?: { role: string; full_name: string }[];
  socialInstagram?: string | null;
  socialLinkedin?: string | null;
}

const roleLabelMap: Record<string, string> = {
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  social_media_head: 'Social Media Head',
};

export function MobileClubProfileCard({
  clubName,
  clubLogo,
  clubAbout,
  postHolders = [],
  socialInstagram,
  socialLinkedin,
}: MobileClubProfileCardProps) {
  const initials = clubName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="mx-auto w-full overflow-hidden"
      style={{
        maxWidth: '320px',
        borderRadius: '22px',
        background: 'hsl(var(--card))',
        boxShadow:
          '0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 20px -2px rgba(0,0,0,0.08), 0 20px 40px -4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Image container */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          margin: '10px 10px 0 10px',
          width: 'calc(100% - 20px)',
          aspectRatio: '3 / 4',
          borderRadius: '16px',
        }}
      >
        {clubLogo ? (
          <img
            src={clubLogo}
            alt={clubName}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl font-bold"
            style={{
              background:
                'linear-gradient(145deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.25))',
              color: 'hsl(var(--primary))',
            }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="px-4 pt-3.5 pb-4 space-y-2.5">
        {/* Name row with verification dot */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold font-display text-foreground leading-tight">
            {clubName}
          </h2>
          <div
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'hsl(var(--primary))' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2.5 5L4.5 7L7.5 3"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* About / Description — 2 lines max */}
        {clubAbout ? (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {clubAbout}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Official Club Dashboard</p>
        )}

        {/* Footer: post-holders preview as badges */}
        {postHolders.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {postHolders.slice(0, 3).map((ph, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] font-medium bg-primary/10 text-primary border-0 px-2 py-0.5"
              >
                {roleLabelMap[ph.role] ?? ph.role}
              </Badge>
            ))}
            {postHolders.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] font-medium px-2 py-0.5"
              >
                +{postHolders.length - 3}
              </Badge>
            )}
          </div>
        )}
        {/* Social Links */}
        {(socialInstagram || socialLinkedin) && (
          <div className="flex justify-center gap-4 pt-1">
            {socialInstagram && (
              <a
                href={socialInstagram.startsWith('http') ? socialInstagram : `https://instagram.com/${socialInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {socialLinkedin && (
              <a
                href={socialLinkedin.startsWith('http') ? socialLinkedin : `https://linkedin.com/company/${socialLinkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
