import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Instagram, Linkedin, GraduationCap, Shield, Calendar, Clock, Users, Tag, MapPin, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ── Types ──

interface MemberCard {
  name: string;
  role: string;
  programme?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  linkedin?: string;
  gmail?: string;
}

interface EventCard {
  name: string;
  date: string;
  end_date?: string;
  type?: string;
  category?: string;
  access_type?: string;
  description?: string;
  attendance_count?: number;
  attendees?: string[];
}

interface ParsedContent {
  blocks: Array<
    | { type: 'members'; header: string; subtext: string; members: MemberCard[] }
    | { type: 'events'; header: string; subtext: string; events: EventCard[] }
    | { type: 'markdown'; content: string }
  >;
}

// ── Parsing ──

function parseResponse(content: string): ParsedContent {
  const blocks: ParsedContent['blocks'] = [];

  // Split by code fences for members-json and events-json
  const regex = /```(members-json|events-json)\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Add any preceding text as markdown
    const before = content.slice(lastIndex, match.index).trim();
    if (before) blocks.push({ type: 'markdown', content: before });

    const blockType = match[1];
    const jsonStr = match[2].trim();

    try {
      const data = JSON.parse(jsonStr);
      if (blockType === 'members-json' && data.members?.length) {
        blocks.push({
          type: 'members',
          header: data.header || 'Members',
          subtext: data.subtext || '',
          members: data.members,
        });
      } else if (blockType === 'events-json' && data.events?.length) {
        blocks.push({
          type: 'events',
          header: data.header || 'Events',
          subtext: data.subtext || '',
          events: data.events,
        });
      }
    } catch {
      // If JSON fails, render as markdown
      blocks.push({ type: 'markdown', content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add trailing text
  const trailing = content.slice(lastIndex).trim();
  if (trailing) blocks.push({ type: 'markdown', content: trailing });

  // Fallback: if no structured blocks found, try legacy member detection
  if (blocks.length === 1 && blocks[0].type === 'markdown') {
    const legacy = tryLegacyMemberParse(content);
    if (legacy) return { blocks: [legacy] };
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'markdown', content });
  }

  return { blocks };
}

function tryLegacyMemberParse(content: string): ParsedContent['blocks'][0] | null {
  const memberPattern = /\d+\.\s*\*{0,2}(President|Vice President|Secretary|Social Media Head|Member|General Member)\*{0,2}/i;
  if (!memberPattern.test(content)) return null;

  const members: MemberCard[] = [];
  const sections = content.split(/(?=\d+\.\s)/);
  for (const section of sections) {
    if (!section.trim()) continue;
    const roleMatch = section.match(/\d+\.\s*\*{0,2}(President|Vice President|Secretary|Social Media Head|Member|General Member)\*{0,2}/i);
    if (!roleMatch) continue;

    const getValue = (key: string): string => {
      const p = new RegExp(`\\*{0,2}${key}:?\\*{0,2}\\s*(.+?)(?:\\n|$)`, 'i');
      const m = section.match(p);
      return m ? m[1].replace(/\*{2}/g, '').replace(/\[(.+?)\]\(.+?\)/g, '$1').trim() : '';
    };
    const getLink = (key: string): string => {
      const lm = section.match(new RegExp(`${key}:?.*?\\[.*?\\]\\((.+?)\\)`, 'i'));
      return lm ? lm[1] : '';
    };

    members.push({
      name: getValue('Name'),
      role: roleMatch[1].trim(),
      programme: getValue('Programme') || getValue('Program'),
      email: getValue('Email'),
      phone: getValue('Phone'),
      instagram: getLink('Instagram') || getValue('Instagram'),
      linkedin: getLink('LinkedIn') || getValue('LinkedIn'),
      gmail: getValue('Gmail') || getValue('Personal Gmail'),
    });
  }

  if (members.length === 0) return null;
  return { type: 'members', header: 'Club Members', subtext: `${members.length} members`, members };
}

// ── Role Styling ──

function getRoleColor(role: string): string {
  const r = role.toLowerCase();
  if (r === 'president') return 'from-amber-500/20 to-orange-500/20 border-amber-400/40';
  if (r === 'vice president') return 'from-purple-500/20 to-violet-500/20 border-purple-400/40';
  if (r.includes('secretary') || r.includes('social media')) return 'from-blue-500/20 to-cyan-500/20 border-blue-400/40';
  return 'from-slate-500/10 to-gray-500/10 border-slate-300/40';
}

function getRoleBadgeColor(role: string): string {
  const r = role.toLowerCase();
  if (r === 'president') return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/30';
  if (r === 'vice president') return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-400/30';
  if (r.includes('secretary') || r.includes('social media')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30';
  return 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-300/30';
}

function getRoleIcon(role: string) {
  const r = role.toLowerCase();
  if (r === 'president' || r === 'vice president') return <Shield className="w-3.5 h-3.5" />;
  return <User className="w-3.5 h-3.5" />;
}

function getAvatarGradient(role: string): string {
  const r = role.toLowerCase();
  if (r === 'president') return 'from-amber-400 to-orange-500';
  if (r === 'vice president') return 'from-purple-400 to-violet-500';
  if (r.includes('secretary') || r.includes('social media')) return 'from-blue-400 to-cyan-500';
  return 'from-slate-400 to-gray-500';
}

// ── Member Card Component ──

function MemberCardComponent({ member, index }: { member: MemberCard; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 28 }}
        onClick={() => setExpanded(true)}
        className={`
          relative cursor-pointer rounded-2xl p-3 border
          bg-gradient-to-br ${getRoleColor(member.role)}
          backdrop-blur-xl shadow-sm
          hover:shadow-md hover:scale-[1.02]
          active:scale-[0.98]
          transition-all duration-200
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(member.role)} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
            {member.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{member.name || 'Unknown'}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${getRoleBadgeColor(member.role)}`}>
              {getRoleIcon(member.role)}
              {member.role}
            </span>
          </div>
          <div className="text-muted-foreground/40 text-xs">→</div>
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-amber-200/40 shadow-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(40px) saturate(1.5)', WebkitBackdropFilter: 'blur(40px) saturate(1.5)' }}
            >
              <div className={`relative h-20 bg-gradient-to-br ${getAvatarGradient(member.role)} flex items-end px-5 pb-3`}>
                <button onClick={() => setExpanded(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/30 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/20">
                    {member.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base drop-shadow-sm">{member.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/25 text-white border border-white/20">
                      {getRoleIcon(member.role)} {member.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {member.programme && <DetailRow icon={<GraduationCap className="w-4 h-4 text-amber-500" />} label="Programme" value={member.programme} />}
                {member.email && <DetailRow icon={<Mail className="w-4 h-4 text-amber-500" />} label="Email" value={member.email} href={`mailto:${member.email}`} />}
                {member.phone && <DetailRow icon={<Phone className="w-4 h-4 text-amber-500" />} label="Phone" value={member.phone} href={`tel:${member.phone}`} />}
                {member.instagram && member.instagram !== 'Not Provided' && (
                  <DetailRow icon={<Instagram className="w-4 h-4 text-amber-500" />} label="Instagram" value="View Profile" href={member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram}`} />
                )}
                {member.linkedin && member.linkedin !== 'Not Provided' && (
                  <DetailRow icon={<Linkedin className="w-4 h-4 text-amber-500" />} label="LinkedIn" value="View Profile" href={member.linkedin.startsWith('http') ? member.linkedin : `https://linkedin.com/in/${member.linkedin}`} />
                )}
                {member.gmail && member.gmail !== 'Not Provided' && (
                  <DetailRow icon={<Mail className="w-4 h-4 text-amber-500" />} label="Gmail" value={member.gmail} href={`mailto:${member.gmail}`} />
                )}
                {!member.programme && !member.email && !member.phone && !member.instagram && !member.linkedin && !member.gmail && (
                  <p className="text-sm text-muted-foreground text-center py-2">No additional details available</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Event Card Component ──

function EventCardComponent({ event, index }: { event: EventCard; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  const getEventTypeColor = (type?: string): string => {
    const t = (type || '').toLowerCase();
    if (t.includes('hackathon')) return 'from-emerald-500/20 to-teal-500/20 border-emerald-400/40';
    if (t.includes('workshop')) return 'from-blue-500/20 to-indigo-500/20 border-blue-400/40';
    if (t.includes('seminar') || t.includes('lecture')) return 'from-violet-500/20 to-purple-500/20 border-violet-400/40';
    if (t.includes('meeting')) return 'from-amber-500/20 to-orange-500/20 border-amber-400/40';
    return 'from-slate-500/10 to-gray-500/10 border-slate-300/40';
  };

  const getEventTypeBadge = (type?: string): string => {
    const t = (type || '').toLowerCase();
    if (t.includes('hackathon')) return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/30';
    if (t.includes('workshop')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30';
    if (t.includes('seminar') || t.includes('lecture')) return 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-400/30';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-300/30';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 28 }}
        onClick={() => setExpanded(true)}
        className={`
          relative cursor-pointer rounded-2xl p-3 border
          bg-gradient-to-br ${getEventTypeColor(event.type)}
          backdrop-blur-xl shadow-sm
          hover:shadow-md hover:scale-[1.02]
          active:scale-[0.98]
          transition-all duration-200
        `}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-md">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{event.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(event.date)}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1" />
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-primary/20 shadow-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(40px) saturate(1.5)', WebkitBackdropFilter: 'blur(40px) saturate(1.5)' }}
            >
              <div className="relative h-20 bg-gradient-to-br from-primary/80 via-primary to-primary/90 flex items-end px-5 pb-3">
                <button onClick={() => setExpanded(false)} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/50 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="font-bold text-white text-base drop-shadow-sm">{event.name}</h3>
                  <p className="text-white/80 text-xs">{formatDate(event.date)}{event.end_date ? ` — ${formatDate(event.end_date)}` : ''}</p>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {event.type && (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${getEventTypeBadge(event.type)}`}>
                      <Tag className="w-3 h-3" /> {event.type}
                    </span>
                    {event.category && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-muted/50 text-muted-foreground border-border/30">
                        {event.category}
                      </span>
                    )}
                  </div>
                )}
                {event.access_type && (
                  <DetailRow icon={<Users className="w-4 h-4 text-primary" />} label="Access" value={event.access_type} />
                )}
                {event.description && (
                  <DetailRow icon={<MapPin className="w-4 h-4 text-primary" />} label="Description" value={event.description} />
                )}
                {typeof event.attendance_count === 'number' && (
                  <DetailRow icon={<Clock className="w-4 h-4 text-primary" />} label="Attendance" value={`${event.attendance_count} attendees`} />
                )}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1">Attendees</p>
                    <div className="flex flex-wrap gap-1">
                      {event.attendees.slice(0, 20).map((name, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-foreground">{name}</span>
                      ))}
                      {event.attendees.length > 20 && <span className="text-[11px] text-muted-foreground">+{event.attendees.length - 20} more</span>}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Shared Detail Row ──

function DetailRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/20">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-600 dark:text-amber-400 hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-sm text-foreground truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

// ── Markdown renderer ──

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">{children}</a>
  ),
};

// ── Main Renderer ──

export function ChatResponseRenderer({ content }: { content: string }) {
  const { blocks } = parseResponse(content);

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === 'members') {
          return (
            <div key={i} className="space-y-2">
              {block.header && <p className="font-semibold text-sm text-foreground">{block.header}</p>}
              {block.subtext && <p className="text-xs text-muted-foreground">{block.subtext}</p>}
              <div className="space-y-2">
                {block.members.map((member, j) => (
                  <MemberCardComponent key={j} member={member} index={j} />
                ))}
              </div>
            </div>
          );
        }
        if (block.type === 'events') {
          return (
            <div key={i} className="space-y-2">
              {block.header && <p className="font-semibold text-sm text-foreground">{block.header}</p>}
              {block.subtext && <p className="text-xs text-muted-foreground">{block.subtext}</p>}
              <div className="space-y-2">
                {block.events.map((event, j) => (
                  <EventCardComponent key={j} event={event} index={j} />
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={i} className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
            <ReactMarkdown components={markdownComponents}>{block.content}</ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
