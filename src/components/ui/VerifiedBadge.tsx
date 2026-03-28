interface VerifiedBadgeProps {
  variant: 'purple' | 'blue' | 'gray';
  size?: number;
}

const VerifiedBadge = ({ variant, size = 16 }: VerifiedBadgeProps) => {
  const id = `vb-${variant}-${Math.random().toString(36).slice(2, 6)}`;
  
  const colors = variant === 'purple'
    ? { start: '#a855f7', mid: '#9333ea', end: '#7e22ce', glow: '#c084fc' }
    : variant === 'gray'
    ? { start: '#9ca3af', mid: '#6b7280', end: '#4b5563', glow: '#d1d5db' }
    : { start: '#3b82f6', mid: '#2563eb', end: '#1d4ed8', glow: '#93c5fd' };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="inline-block shrink-0 ml-1"
      style={{ verticalAlign: 'middle', filter: `drop-shadow(0 1px 2px ${colors.end}44)` }}
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.start} />
          <stop offset="50%" stopColor={colors.mid} />
          <stop offset="100%" stopColor={colors.end} />
        </linearGradient>
        <linearGradient id={`shine-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* Starburst shape */}
      <path
        d="M12 1.5l2.09 3.36L18 3.54l.36 3.91L22 9.27l-2.18 3.27L22 15.81l-3.64 1.82L18 21.54l-3.91-.32L12 24.5l-2.09-3.28L6 21.54l-.36-3.91L2 15.81l2.18-3.27L2 9.27l3.64-1.82L6 3.54l3.91.32L12 1.5z"
        fill={`url(#grad-${id})`}
      />
      {/* Shine overlay */}
      <path
        d="M12 1.5l2.09 3.36L18 3.54l.36 3.91L22 9.27l-2.18 3.27L22 15.81l-3.64 1.82L18 21.54l-3.91-.32L12 24.5l-2.09-3.28L6 21.54l-.36-3.91L2 15.81l2.18-3.27L2 9.27l3.64-1.82L6 3.54l3.91.32L12 1.5z"
        fill={`url(#shine-${id})`}
      />
      {/* Checkmark */}
      <path
        d="M8.5 12.5L10.5 14.5L15.5 9.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const getRoleBadgeVariant = (role: string): 'purple' | 'blue' | 'gray' | null => {
  if (role === 'president' || role === 'vice_president') return 'purple';
  if (role === 'member') return 'gray';
  if ([
    'secretary', 'general_secretary', 'deputy_secretary',
    'social_media_head', 'social_media_coordinator',
    'technical_pr_head', 'technical_pr_coordinator',
    'treasurer', 'deputy_treasurer', 'assistant_treasurer',
  ].includes(role)) return 'blue';
  return null;
};

export default VerifiedBadge;
