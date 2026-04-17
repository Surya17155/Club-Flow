import { useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Instagram, Linkedin, GraduationCap, Shield, Calendar, Clock, Users, Tag, MapPin, ChevronDown, Download, FileSpreadsheet, FileText, Info, CheckCircle2, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';

// ── Types ──

interface MemberCard {
  name: string;
  role: string;
  programme?: string;
  year?: string;
  section?: string;
  roll_no?: string;
  email?: string;
  phone?: string;
  about?: string;
  instagram?: string;
  linkedin?: string;
  gmail?: string;
  member_since?: string;
  avatar_url?: string;
  club_memberships?: Array<{ club_name: string; role: string }>;
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

interface ToolResult {
  action: string;
  title: string;
  summary: string;
  details?: Record<string, number>;
  items?: Array<{ name: string; status: string }>;
}

interface MemberFormData {
  full_name: string;
  email: string;
  programme: string;
  year: string;
  section: string;
  roll_no: string;
  phone: string;
  class_coordinator: string;
  role: string;
}

interface EventData {
  club_name?: string;
  event_name: string;
  event_date: string;
  end_date?: string;
  event_type?: string;
  category?: string;
  access_type?: string;
  attendance_given?: boolean;
  description?: string;
  total_attendees: number;
  attendees: Array<{
    name: string;
    email: string;
    roll_no: string;
    phone: string;
    programme: string;
    year: string;
    section: string;
    class_coordinator: string;
    avatar_url?: string;
    scanned_at: string;
    method: string;
  }>;
}

interface ParsedContent {
  blocks: Array<
    | { type: 'members'; header: string; subtext: string; members: MemberCard[] }
    | { type: 'events'; header: string; subtext: string; events: EventCard[] }
    | { type: 'tool-result'; data: ToolResult }
    | { type: 'member-form'; data: MemberFormData }
    | { type: 'event-data'; data: EventData }
    | { type: 'markdown'; content: string }
  >;
}

// ── Parsing ──

function parseResponse(content: string): ParsedContent {
  const blocks: ParsedContent['blocks'] = [];

  const regex = /```(members-json|events-json|tool-result|member-form-json|event-data-json)\s*\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index).trim();
    if (before) blocks.push({ type: 'markdown', content: before });

    const blockType = match[1];
    const jsonStr = match[2].trim();

    try {
      const data = JSON.parse(jsonStr);
      if (blockType === 'members-json' && data.members?.length) {
        blocks.push({ type: 'members', header: data.header || 'Members', subtext: data.subtext || '', members: data.members });
      } else if (blockType === 'events-json' && data.events?.length) {
        blocks.push({ type: 'events', header: data.header || 'Events', subtext: data.subtext || '', events: data.events });
      } else if (blockType === 'tool-result' && data.action) {
        blocks.push({ type: 'tool-result', data });
      } else if (blockType === 'member-form-json') {
        blocks.push({ type: 'member-form', data });
      } else if (blockType === 'event-data-json') {
        blocks.push({ type: 'event-data', data });
      }
    } catch {
      blocks.push({ type: 'markdown', content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  const trailing = content.slice(lastIndex).trim();
  if (trailing) blocks.push({ type: 'markdown', content: trailing });

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
  const memberPattern = /\d+\.\s*\*{0,2}(President|Vice President|General Secretary|Secretary|Deputy Secretary|Social Media Head|Social Media Coordinator|Technical (?:&|and) PR Head|Technical (?:&|and) PR Coordinator|Treasurer|Deputy Treasurer|Assistant Treasurer|Member|General Member)\*{0,2}/i;
  if (!memberPattern.test(content)) return null;

  const members: MemberCard[] = [];
  const sections = content.split(/(?=\d+\.\s)/);
  for (const section of sections) {
    if (!section.trim()) continue;
    const roleMatch = section.match(/\d+\.\s*\*{0,2}(President|Vice President|General Secretary|Secretary|Deputy Secretary|Social Media Head|Social Media Coordinator|Technical (?:&|and) PR Head|Technical (?:&|and) PR Coordinator|Treasurer|Deputy Treasurer|Assistant Treasurer|Member|General Member)\*{0,2}/i);
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

// ── Role Styling (Neo-Brutalism) ──

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  social_media_head: 'Social Media Head', social_media_coordinator: 'Social Media Coordinator',
  technical_pr_head: 'Technical & PR Head', technical_pr_coordinator: 'Technical & PR Coordinator',
  general_secretary: 'General Secretary', secretary: 'Secretary',
  deputy_secretary: 'Deputy Secretary', treasurer: 'Treasurer',
  deputy_treasurer: 'Deputy Treasurer', assistant_treasurer: 'Assistant Treasurer',
  member: 'Member',
};

function normalizeRoleLabel(role: string): string {
  if (!role) return 'Member';
  const key = role.toLowerCase().replace(/\s+/g, '_').replace(/&/g, '').replace(/__+/g, '_');
  return roleLabelMap[key] || role;
}

function getRoleBadgeBg(role: string): string {
  const r = (role || '').toLowerCase();
  if (r === 'president') return '#E98A3A';
  if (r.includes('vice')) return '#C9B6FF';
  if (r.includes('secretary')) return '#A8D8FF';
  if (r.includes('social')) return '#FFB8D1';
  if (r.includes('technical') || r.includes('pr')) return '#C5C0FF';
  if (r.includes('treasurer')) return '#A8E6C2';
  return '#FDE8D0';
}

// ── Member Card Component (Neo-Brutalism, matches MemberManagement) ──

const MemberCardComponent = memo(function MemberCardComponent({ member, index }: { member: MemberCard; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const roleLabel = normalizeRoleLabel(member.role);
  const initials = (member.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 28 }}
        onClick={() => setExpanded(true)}
        className="cursor-pointer flex items-center gap-3 p-3 bg-white border-[2px] border-[#111] rounded-[6px] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
        style={{ boxShadow: '3px 3px 0px #111', fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <div
          className="w-10 h-10 rounded-[4px] border-[2px] border-[#111] flex items-center justify-center font-black text-[#111] text-sm shrink-0"
          style={{ background: '#FDE8D0' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-[#111] truncate">{member.name || 'Unknown'}</p>
          <div className="mt-0.5">
            <span
              className="inline-block px-2 py-0.5 text-[10px] font-black border-[1.5px] border-[#111] rounded-[3px] text-[#111]"
              style={{ background: getRoleBadgeBg(member.role) }}
            >
              {roleLabel}
            </span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-[#111]/40 shrink-0" />
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white border-[3px] border-[#111] rounded-[6px]"
              style={{ boxShadow: '4px 4px 0px #111', scrollbarWidth: 'none', fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <div className="flex items-center justify-between p-4 border-b-[2px] border-[#111]">
                <h3 className="font-black text-lg text-[#111]">View Profile</h3>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white border-[2px] border-[#111] rounded-[4px] hover:bg-[#FDE8D0] transition-colors"
                  style={{ boxShadow: '2px 2px 0px #111' }}
                >
                  <X className="w-4 h-4 text-[#111]" />
                </button>
              </div>

              <div className="p-5 flex flex-col items-center text-center space-y-4">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-[#111] bg-[#FDE8D0] flex items-center justify-center text-[#111] text-2xl font-black"
                  style={{ boxShadow: '3px 3px 0px #E98A3A' }}
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#111]">{member.name || 'Unknown'}</h3>
                  <div className="mt-1.5">
                    <span
                      className="px-3 py-1 text-xs font-black border-[2px] border-[#111] rounded-[4px] text-[#111]"
                      style={{ background: getRoleBadgeBg(member.role) }}
                    >
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {(member.linkedin || member.instagram || member.gmail) && (
                  <div className="flex gap-3 items-center">
                    {member.linkedin && member.linkedin !== 'Not Provided' && (
                      <a href={member.linkedin.startsWith('http') ? member.linkedin : `https://linkedin.com/in/${member.linkedin}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-[4px] border-[2px] border-[#111] bg-white flex items-center justify-center hover:bg-[#FDE8D0] transition-colors" style={{ boxShadow: '2px 2px 0px #111' }}>
                        <Linkedin className="w-4 h-4 text-[#111]" />
                      </a>
                    )}
                    {member.instagram && member.instagram !== 'Not Provided' && (
                      <a href={member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-[4px] border-[2px] border-[#111] bg-white flex items-center justify-center hover:bg-[#FDE8D0] transition-colors" style={{ boxShadow: '2px 2px 0px #111' }}>
                        <Instagram className="w-4 h-4 text-[#111]" />
                      </a>
                    )}
                    {member.gmail && member.gmail !== 'Not Provided' && (
                      <a href={`mailto:${member.gmail}`} className="w-9 h-9 rounded-[4px] border-[2px] border-[#111] bg-white flex items-center justify-center hover:bg-[#FDE8D0] transition-colors" style={{ boxShadow: '2px 2px 0px #111' }}>
                        <Mail className="w-4 h-4 text-[#111]" />
                      </a>
                    )}
                  </div>
                )}

                {member.about && (
                  <div className="w-full text-left bg-[#FDE8D0] rounded-[6px] p-3 border-[2px] border-[#111]">
                    <h4 className="text-xs font-black text-[#111]/50 uppercase tracking-wider mb-1">About</h4>
                    <p className="text-sm text-[#111]/80 leading-relaxed font-medium">{member.about}</p>
                  </div>
                )}

                {(member.programme || member.year || member.section || member.roll_no) && (
                  <div className="w-full text-left space-y-2 bg-white rounded-[6px] p-4 text-sm border-[2px] border-[#111]">
                    <h4 className="text-xs font-black text-[#111]/50 uppercase tracking-wider mb-2">Academic Details</h4>
                    {member.programme && (
                      <div className="flex justify-between gap-3"><span className="text-[#111]/50 font-medium">Programme:</span><span className="text-[#111] font-bold text-right">{member.programme}</span></div>
                    )}
                    {member.year && (
                      <div className="flex justify-between gap-3"><span className="text-[#111]/50 font-medium">Year:</span><span className="text-[#111] font-bold text-right">{member.year}</span></div>
                    )}
                    {member.section && (
                      <div className="flex justify-between gap-3"><span className="text-[#111]/50 font-medium">Section:</span><span className="text-[#111] font-bold text-right">{member.section}</span></div>
                    )}
                    {member.roll_no && (
                      <div className="flex justify-between gap-3"><span className="text-[#111]/50 font-medium">Roll No:</span><span className="text-[#111] font-bold text-right">{member.roll_no}</span></div>
                    )}
                  </div>
                )}

                {(member.email || member.phone) && (
                  <div className="w-full text-left space-y-2 bg-white rounded-[6px] p-4 text-sm border-[2px] border-[#111]">
                    <h4 className="text-xs font-black text-[#111]/50 uppercase tracking-wider mb-2">Contact</h4>
                    {member.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#111]/40 shrink-0" />
                        <a href={`mailto:${member.email}`} className="text-[#111] font-medium break-all hover:underline">{member.email}</a>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#111]/40 shrink-0" />
                        <a href={`tel:${member.phone}`} className="text-[#111] font-medium hover:underline">{member.phone}</a>
                      </div>
                    )}
                  </div>
                )}

                {member.club_memberships && member.club_memberships.length > 0 && (
                  <div className="w-full text-left space-y-2 bg-white rounded-[6px] p-4 text-sm border-[2px] border-[#111]">
                    <h4 className="text-xs font-black text-[#111]/50 uppercase tracking-wider mb-2">Club Memberships</h4>
                    <div className="space-y-2">
                      {member.club_memberships.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-[4px] border-[1.5px] border-[#111] bg-[#FFFDF5]">
                          <span className="font-bold text-[#111] text-sm">{c.club_name}</span>
                          <span className="text-[10px] px-2 py-0.5 font-black border-[1.5px] border-[#111] rounded-[3px] bg-[#E98A3A]/20 text-[#111]">
                            {normalizeRoleLabel(c.role)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {member.member_since && (
                  <div className="w-full flex justify-between text-sm">
                    <span className="text-[#111]/50 font-medium">Member Since</span>
                    <span className="text-[#111] font-bold">{(() => { try { return new Date(member.member_since).toLocaleDateString(); } catch { return member.member_since; } })()}</span>
                  </div>
                )}

                {!member.programme && !member.year && !member.section && !member.roll_no && !member.email && !member.phone && !member.instagram && !member.linkedin && !member.gmail && !member.about && (
                  <p className="text-sm text-[#111]/50 font-medium py-2">No additional details available</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

// ── Event Card Component ──

const EventCardComponent = memo(function EventCardComponent({ event, index }: { event: EventCard; index: number }) {
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
        className={`relative cursor-pointer rounded-2xl p-3 border bg-gradient-to-br ${getEventTypeColor(event.type)} backdrop-blur-xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
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
});

// ── Member Form Component ──

const MemberFormComponent = memo(function MemberFormComponent({ data, onSubmit }: { data: MemberFormData; onSubmit?: (data: MemberFormData) => void }) {
  const [form, setForm] = useState<MemberFormData>(data);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.full_name || !form.email) return;
    setSubmitted(true);
    onSubmit?.(form);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-4 border border-emerald-400/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <motion.path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.4 }} />
            </motion.svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Form Submitted</p>
            <p className="text-xs text-muted-foreground">Adding {form.full_name} to the club...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/30 bg-card shadow-lg overflow-hidden"
    >
      <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
        <p className="text-sm font-semibold text-foreground">Add New Member</p>
        <p className="text-xs text-muted-foreground">Fill in the missing details below</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Full Name *</Label>
            <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-xs">Email *</Label>
            <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-xs mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Programme</Label>
            <Input value={form.programme} onChange={e => setForm(f => ({ ...f, programme: e.target.value }))} placeholder="e.g. BBA" className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-xs">Year</Label>
            <Input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 2" className="h-8 text-xs mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Section</Label>
            <Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. A" className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-xs">Roll No</Label>
            <Input value={form.roll_no} onChange={e => setForm(f => ({ ...f, roll_no: e.target.value }))} className="h-8 text-xs mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-8 text-xs mt-1" />
          </div>
          <div>
            <Label className="text-xs">Class Coordinator</Label>
            <Input value={form.class_coordinator} onChange={e => setForm(f => ({ ...f, class_coordinator: e.target.value }))} className="h-8 text-xs mt-1" />
          </div>
        </div>
        <Button onClick={handleSubmit} size="sm" className="w-full mt-2" disabled={!form.full_name || !form.email}>
          Add Member
        </Button>
      </div>
    </motion.div>
  );
});

// ── Label helpers ──

function normalizeAccessType(raw?: string): string {
  if (!raw) return '';
  const v = raw.toLowerCase().replace(/[_-]/g, ' ').trim();
  if (v.includes('all') || v === 'open') return 'Open to All';
  if (v.includes('club')) return 'Club Members Only';
  if (v.includes('invite')) return 'Invite Only';
  return raw;
}

function normalizeEventType(raw?: string): string {
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// ── Event Data Component (flat card with in-card attendance panel) ──

const EventDataComponent = memo(function EventDataComponent({ data }: { data: EventData }) {
  const [showAttendance, setShowAttendance] = useState(false);
  const [expandedAttendee, setExpandedAttendee] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };
  const formatTime = (d: string) => {
    try { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return ''; }
  };

  const downloadCSV = useCallback(() => {
    const headers = ['S.No', 'Student Name', 'Email', 'Roll No', 'Phone', 'Programme', 'Year', 'Section', 'Class Coordinator', 'Scan Time', 'Method'];
    const rows = data.attendees.map((a, i) => [
      i + 1, a.name, a.email, a.roll_no, a.phone, a.programme, a.year, a.section, a.class_coordinator,
      new Date(a.scanned_at).toLocaleString(), a.method,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.event_name.replace(/[^a-zA-Z0-9]/g, '_')}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [data]);

  const downloadXLSX = useCallback(() => {
    const rows = data.attendees.map((a, i) => ({
      'S.No': i + 1, 'Student Name': a.name, 'Email': a.email, 'Roll No': a.roll_no || '—',
      'Phone': a.phone || '—', 'Programme': a.programme || '—', 'Year': a.year || '—',
      'Section': a.section || '—', 'Class Coordinator': a.class_coordinator || '—',
      'Scan Time': new Date(a.scanned_at).toLocaleString(), 'Method': a.method,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(row => String((row as any)[key]).length)) + 2,
    }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `${data.event_name.replace(/[^a-zA-Z0-9]/g, '_')}_attendance.xlsx`);
    setShowExportMenu(false);
  }, [data]);

  const accessLabel = normalizeAccessType(data.access_type);
  const typeLabel = normalizeEventType(data.event_type);

  // ── Attendance Panel (in-card) ──
  if (showAttendance) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-border bg-card shadow-md overflow-hidden"
        style={{ minHeight: 380 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowAttendance(false); setExpandedAttendee(null); }}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
            <div>
              <p className="text-sm font-semibold text-foreground">Attendance</p>
              <p className="text-xs text-muted-foreground">{data.total_attendees} attendees</p>
            </div>
          </div>
          <div className="relative">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl" onClick={() => setShowExportMenu(!showExportMenu)}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <AnimatePresence>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
                  >
                    <button onClick={downloadCSV} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted transition-colors">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Download CSV
                    </button>
                    <button onClick={downloadXLSX} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted transition-colors border-t border-border/50">
                      <FileText className="w-4 h-4 text-blue-500" /> Download Excel
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Attendee list with scrollbar */}
        <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: 320 }}>
          {data.attendees.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No attendees recorded</p>
          )}
          {data.attendees.map((attendee, idx) => (
            <div key={idx}>
              <button
                onClick={() => setExpandedAttendee(expandedAttendee === idx ? null : idx)}
                className="w-full text-left rounded-xl p-3 bg-muted/40 border border-border/30 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {attendee.avatar_url ? (
                    <img src={attendee.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      {attendee.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{attendee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {attendee.programme}{attendee.programme && attendee.section ? ' • ' : ''}{attendee.section ? `Section ${attendee.section}` : ''}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${expandedAttendee === idx ? 'rotate-180' : ''}`} />
                </div>
              </button>
              <AnimatePresence>
                {expandedAttendee === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 py-2 mt-1 rounded-xl bg-muted/30 border border-border/20 space-y-1.5">
                      {attendee.email && (
                        <div className="flex items-center gap-2 text-xs">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground truncate">{attendee.email}</span>
                        </div>
                      )}
                      {attendee.roll_no && (
                        <div className="flex items-center gap-2 text-xs">
                          <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground">Roll No: {attendee.roll_no}</span>
                        </div>
                      )}
                      {attendee.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground">{attendee.phone}</span>
                        </div>
                      )}
                      {attendee.year && (
                        <div className="flex items-center gap-2 text-xs">
                          <GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground">Year {attendee.year}</span>
                        </div>
                      )}
                      {attendee.class_coordinator && (
                        <div className="flex items-center gap-2 text-xs">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground">CC: {attendee.class_coordinator}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{new Date(attendee.scanned_at).toLocaleString()} • {attendee.method}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Event Summary View ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card shadow-md overflow-hidden"
    >
      <div className="p-4 space-y-3">
        {/* Club name */}
        {data.club_name && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{data.club_name}</p>
        )}

        {/* Event title */}
        <h3 className="font-bold text-lg text-foreground leading-tight">{data.event_name}</h3>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span>{formatDate(data.event_date)}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>
            {formatTime(data.event_date)}
            {data.end_date ? ` — ${formatTime(data.end_date)}` : ''}
          </span>
        </div>

        {/* Description as plain text */}
        {data.description && (
          <p className="text-sm text-foreground/80 leading-relaxed">{data.description}</p>
        )}

        {/* Event details badges */}
        <div className="flex flex-wrap gap-2">
          {typeLabel && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-400/20">
              <Tag className="w-3 h-3" /> {typeLabel}
            </span>
          )}
          {data.category && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/30">
              {data.category}
            </span>
          )}
          {accessLabel && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-400/20">
              <Globe className="w-3 h-3" /> {accessLabel}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${data.attendance_given ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/20' : 'bg-muted text-muted-foreground border-border/30'}`}>
            <CheckCircle2 className="w-3 h-3" /> Attendance: {data.attendance_given ? 'Yes' : 'No'}
          </span>
        </div>

        {/* Attendance button */}
        <button
          onClick={() => setShowAttendance(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Attendance</span>
          </div>
          <span className="text-sm font-semibold text-primary">{data.total_attendees} attendees</span>
        </button>
      </div>
    </motion.div>
  );
});

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

export const ChatResponseRenderer = memo(function ChatResponseRenderer({ content, onFormSubmit }: { content: string; onFormSubmit?: (data: MemberFormData) => void }) {
  const { blocks } = useMemo(() => parseResponse(content), [content]);

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
        if (block.type === 'tool-result') {
          const d = block.data;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-2xl p-4 border border-emerald-400/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                  className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                >
                  <motion.svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <motion.path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.4 }} />
                  </motion.svg>
                </motion.div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{d.title || 'Task Successfully Completed'}</p>
                  <p className="text-xs text-muted-foreground">{d.summary || 'Your task has been successfully completed.'}</p>
                </div>
              </div>
              {d.details && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(d.details).map(([key, val]) => (
                    <span key={key} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/20 font-medium">
                      {key}: {val}
                    </span>
                  ))}
                </div>
              )}
              {d.items && d.items.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-0.5">
                  {d.items.slice(0, 20).map((item, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'added' ? 'bg-emerald-500' : item.status === 'failed' ? 'bg-destructive' : 'bg-muted-foreground/40'}`} />
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] opacity-70">{item.status}</span>
                    </div>
                  ))}
                  {d.items.length > 20 && <p className="text-[10px] text-muted-foreground">+{d.items.length - 20} more</p>}
                </div>
              )}
            </motion.div>
          );
        }
        if (block.type === 'member-form') {
          return <MemberFormComponent key={i} data={block.data} onSubmit={onFormSubmit} />;
        }
        if (block.type === 'event-data') {
          return <EventDataComponent key={i} data={block.data} />;
        }
        if (block.type === 'markdown') {
          return (
            <div key={i} className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
              <ReactMarkdown components={markdownComponents}>{block.content}</ReactMarkdown>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
});
