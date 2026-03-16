import { useNavigate } from 'react-router-dom';
import { Settings, Instagram, Linkedin, Mail } from 'lucide-react';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';

interface MobileProfileCardProps {
  fullName: string;
  roleLabel: string;
  clubName?: string;
  avatarUrl?: string;
  programme?: string;
  year?: string;
  about?: string;
  isPersonal?: boolean;
  viewMode?: 'personal' | 'club';
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
  viewMode = 'personal',
  socialLinkedin,
  socialInstagram,
  socialGmail,
}: MobileProfileCardProps) {
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hasSocials = socialLinkedin || socialInstagram || socialGmail;

  return (
    <div className="relative rounded-3xl overflow-hidden glass-card">
      {/* Hero image area — image fills the card frame */}
      <div className="relative w-full aspect-[3/4]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-contain rounded-3xl"
            style={{ objectPosition: 'top center' }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl font-bold text-primary-foreground rounded-3xl"
            style={{
              background: 'linear-gradient(145deg, hsl(30 60% 78%), hsl(36 55% 72%), hsl(25 50% 68%))',
            }}
          >
            {initials}
          </div>
        )}

        {/* Seamless white-tone gradient blur overlay at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-[55%] rounded-b-3xl pointer-events-none"
          style={{
            background: 'linear-gradient(to top, hsl(var(--card)) 0%, hsl(var(--card)) 15%, hsl(var(--card) / 0.92) 25%, hsl(var(--card) / 0.7) 40%, hsl(var(--card) / 0.4) 55%, hsl(var(--card) / 0.15) 70%, hsl(var(--card) / 0.05) 85%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[40%] rounded-b-3xl pointer-events-none"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            maskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 30%, transparent 100%)',
          }}
        />

        {/* Social icons on image */}
        {hasSocials && (
          <div className="absolute bottom-16 left-5 z-10 flex gap-3">
            {socialLinkedin && (
              <a
                href={socialLinkedin.startsWith('http') ? socialLinkedin : `https://${socialLinkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/50 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-foreground" />
              </a>
            )}
            {socialInstagram && (
              <a
                href={socialInstagram.startsWith('http') ? socialInstagram : `https://${socialInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/50 transition-colors"
              >
                <Instagram className="w-4 h-4 text-foreground" />
              </a>
            )}
            {socialGmail && (
              <a
                href={`mailto:${socialGmail}`}
                className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center hover:bg-white/50 transition-colors"
              >
                <Mail className="w-4 h-4 text-foreground" />
              </a>
            )}
          </div>
        )}

        {/* Name & role text on top of blur */}
        <div className="absolute bottom-4 left-5 right-5 z-10">
          <h2 className="text-xl font-bold font-display text-foreground drop-shadow-sm">{fullName}</h2>
          <p className="text-sm font-semibold text-muted-foreground mt-0.5">
            {isPersonal ? 'Student' : `${roleLabel} • ${clubName}`}
          </p>
        </div>

        {/* ProfileDropdown removed from card — now in header */}
      </div>

      {/* Info below image */}
      <div className="px-5 pt-4 pb-5 space-y-4">
        {/* Programme & Year chips */}
        {(programme || year) && (
          <div className="flex gap-6 text-sm">
            {year && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">Year</p>
                <p className="font-medium text-foreground">{year}</p>
              </div>
            )}
            {programme && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">Program</p>
                <p className="font-medium text-foreground">{programme}</p>
              </div>
            )}
          </div>
        )}

        {/* About / Bio */}
        {about && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 mb-1">About</p>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{about}</p>
          </div>
        )}

      </div>
    </div>
  );
}
