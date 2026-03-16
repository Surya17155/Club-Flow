import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

interface MobileProfileCardProps {
  fullName: string;
  roleLabel: string;
  clubName?: string;
  avatarUrl?: string;
  programme?: string;
  year?: string;
  about?: string;
  isPersonal?: boolean;
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
}: MobileProfileCardProps) {
  const navigate = useNavigate();
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative rounded-3xl overflow-hidden glass-card">
      {/* Hero image area with gradient overlay */}
      <div
        className="relative w-full aspect-[4/3] flex items-end justify-center"
        style={{
          background: 'linear-gradient(145deg, hsl(30 60% 78%), hsl(36 55% 72%), hsl(25 50% 68%))',
        }}
      >
        {/* Settings icon */}
        <button
          onClick={() => navigate('/settings')}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center"
        >
          <Settings className="w-4 h-4 text-white" />
        </button>

        {/* Avatar positioned at bottom center overlapping */}
        <div className="relative -mb-16 z-10">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-28 h-28 rounded-2xl border-4 border-white shadow-elevated object-cover"
            />
          ) : (
            <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-elevated flex items-center justify-center text-3xl font-bold bg-primary text-primary-foreground">
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* Info below */}
      <div className="pt-20 pb-5 px-5 text-center">
        <h2 className="text-xl font-bold font-display text-foreground">{fullName}</h2>
        <p className="text-sm font-semibold text-primary mt-1">
          {isPersonal ? 'Student' : `${roleLabel} • ${clubName}`}
        </p>

        {(programme || year) && (
          <div className="flex justify-center gap-6 mt-4 text-sm">
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

        {about && (
          <div className="mt-4 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 mb-1">About</p>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{about}</p>
          </div>
        )}
      </div>
    </div>
  );
}
