import { Badge } from '@/components/ui/badge';

interface MobileClubProfileCardProps {
  clubName: string;
  clubLogo?: string | null;
  clubAbout?: string | null;
  postHolders?: { role: string; full_name: string }[];
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
}: MobileClubProfileCardProps) {
  const initials = clubName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        width: '100%',
        maxWidth: '320px',
        aspectRatio: '3 / 4',
        borderRadius: '28px',
        background: '#111',
        boxShadow: '0 20px 40px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.25)',
      }}
    >
      {/* Layer 1: Club Logo / Image */}
      {clubLogo ? (
        <img
          src={clubLogo}
          alt={clubName}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'center', zIndex: 1 }}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center text-5xl font-bold text-white"
          style={{
            background: 'linear-gradient(145deg, hsl(30 60% 78%), hsl(36 55% 72%), hsl(25 50% 68%))',
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
          height: '45%',
          zIndex: 2,
          borderRadius: '0 0 28px 28px',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0) 100%)',
          maskImage: 'linear-gradient(to top, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent 100%)',
        }}
      />

      {/* Layer 3: Content Layer */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 pb-5 flex flex-col justify-end"
        style={{ zIndex: 3, height: '45%' }}
      >
        {/* Club Name */}
        <h2 className="text-xl font-bold font-display text-white drop-shadow-md">{clubName}</h2>

        {/* Badge */}
        <Badge className="mt-1.5 w-fit bg-white/20 text-white border-0 text-[10px] font-semibold backdrop-blur-md">
          Official Dashboard
        </Badge>

        {/* Post-holders preview */}
        {postHolders.length > 0 && (
          <div className="mt-3 space-y-1">
            {postHolders.slice(0, 3).map((ph, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-white/55">{roleLabelMap[ph.role] ?? ph.role}</span>
                <span className="text-white/80 font-medium">{ph.full_name}</span>
              </div>
            ))}
          </div>
        )}

        {/* About */}
        {clubAbout && (
          <p className="text-xs text-white/55 mt-2 line-clamp-2 leading-relaxed">{clubAbout}</p>
        )}
      </div>
    </div>
  );
}
