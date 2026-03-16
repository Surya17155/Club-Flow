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
      {/* Hero image area — image fills most of the card */}
      <div className="relative w-full aspect-[4/3]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl font-bold text-primary-foreground"
            style={{
              background: 'linear-gradient(145deg, hsl(30 60% 78%), hsl(36 55% 72%), hsl(25 50% 68%))',
            }}
          >
            {initials}
          </div>
        )}

        {/* Gradient blur overlay at bottom of image */}
        <div
          className="absolute inset-x-0 bottom-0 h-[45%]"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
          }}
        />

        {/* Name & role text on top of blur */}
        <div className="absolute bottom-4 left-5 right-5 z-10">
          <h2 className="text-xl font-bold font-display text-white drop-shadow-md">{fullName}</h2>
          <p className="text-sm font-semibold text-white/85 mt-0.5 drop-shadow-sm">
            {isPersonal ? 'Student' : `${roleLabel} • ${clubName}`}
          </p>
        </div>

        {/* ProfileDropdown trigger (top-right settings) */}
        <div className="absolute top-3 right-3 z-20">
          <ProfileDropdown viewMode={viewMode} />
        </div>
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

        {/* Social handles */}
        {hasSocials && (
          <div className="flex gap-4 pt-1">
            {socialLinkedin && (
              <a
                href={socialLinkedin.startsWith('http') ? socialLinkedin : `https://${socialLinkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-primary" />
              </a>
            )}
            {socialInstagram && (
              <a
                href={socialInstagram.startsWith('http') ? socialInstagram : `https://${socialInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Instagram className="w-4 h-4 text-primary" />
              </a>
            )}
            {socialGmail && (
              <a
                href={`mailto:${socialGmail}`}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Mail className="w-4 h-4 text-primary" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
