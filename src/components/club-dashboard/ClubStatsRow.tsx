interface StatItem {
  label: string;
  value: string | number;
  path: string;
}

interface Props {
  stats: StatItem[];
}

const ClubStatsRow = ({ stats }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {stats.map((stat, i) => (
      <div key={i} className="glass-card p-5 relative overflow-hidden group hover:bg-white/50 transition-colors">
        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
          <svg className="w-24 h-12 text-primary/50" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 100 30">
            <path d={stat.path} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    ))}
  </div>
);

export default ClubStatsRow;
