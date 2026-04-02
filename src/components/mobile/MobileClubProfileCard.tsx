import { Instagram, Linkedin } from 'lucide-react';

interface MobileClubProfileCardProps {
  clubName: string;
  clubLogo?: string | null;
  clubAbout?: string | null;
  postHolders?: { role: string; full_name: string }[];
  socialInstagram?: string | null;
  socialLinkedin?: string | null;
  tagline?: string | null;
}

export function MobileClubProfileCard({
  clubName,
  clubLogo,
  clubAbout,
  postHolders = [],
  socialInstagram,
  socialLinkedin,
  tagline,
}: MobileClubProfileCardProps) {
  const initials = clubName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const president = postHolders.find(ph => ph.role === 'president');

  return (
    <div
      className="mx-auto w-full overflow-hidden border-[3px] border-[#111] rounded-[6px] bg-white"
      style={{ maxWidth: '320px', boxShadow: '4px 4px 0px #111' }}
    >
      {/* Image container */}
      <div
        className="relative w-full overflow-hidden border-b-[3px] border-[#111]"
        style={{
          aspectRatio: '3 / 4',
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
            className="w-full h-full flex items-center justify-center text-5xl font-black"
            style={{
              background: '#FDE8D0',
              color: '#111',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="px-4 pt-3.5 pb-4 space-y-2">
        {/* Name row with verification dot */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-[#111] leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {clubName}
          </h2>
          <div
            className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center flex-shrink-0 border-[2px] border-[#111]"
            style={{ background: '#E98A3A' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2.5 5L4.5 7L7.5 3"
                stroke="#111"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Tagline */}
        {tagline && (
          <p className="text-xs text-[#111]/60 font-medium italic">{tagline}</p>
        )}

        {/* President tag */}
        {president && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-[2px] border-[#111] rounded-[4px] bg-[#E98A3A] text-[#111]">
              President
            </span>
            <span className="text-xs font-bold text-[#111]">{president.full_name}</span>
          </div>
        )}

        {/* About / Description — 2 lines max */}
        {clubAbout ? (
          <p className="text-xs text-[#111]/60 line-clamp-2 leading-relaxed font-medium">
            {clubAbout}
          </p>
        ) : (
          <p className="text-xs text-[#111]/40 italic font-medium">Official Club Dashboard</p>
        )}

        {/* Social Links */}
        {(socialInstagram || socialLinkedin) && (
          <div className="flex justify-center gap-4 pt-1">
            {socialInstagram && (
              <a
                href={socialInstagram.startsWith('http') ? socialInstagram : `https://instagram.com/${socialInstagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center border-[2px] border-[#111] rounded-[4px] hover:bg-[#E98A3A]/20 transition-colors"
              >
                <Instagram className="w-4 h-4 text-[#111]" />
              </a>
            )}
            {socialLinkedin && (
              <a
                href={socialLinkedin.startsWith('http') ? socialLinkedin : `https://linkedin.com/company/${socialLinkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center border-[2px] border-[#111] rounded-[4px] hover:bg-[#E98A3A]/20 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-[#111]" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
