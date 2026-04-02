import { useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Instagram, Linkedin, GraduationCap, Shield, Calendar, Clock, Users, Tag, MapPin, ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
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

// ── Role Styling ──

function getRoleColor(role: string): string {
  const r = role.toLowerCase();
  if (r === 'president') return 'from-amber-500/20 to-orange-500/20 border-amber-400/40';
  if (r === 'vice president') return 'from-purple-500/20 to-violet-500/20 border-purple-400/40';
  if (r.includes('secretary')) return 'from-blue-500/20 to-cyan-500/20 border-blue-400/40';
  if (r.includes('social media')) return 'from-pink-500/20 to-rose-500/20 border-pink-400/40';
  if (r.includes('technical') || r.includes('pr')) return 'from-indigo-500/20 to-violet-500/20 border-indigo-400/40';
  if (r.includes('treasurer')) return 'from-emerald-500/20 to-teal-500/20 border-emerald-400/40';
  if (r === 'member') return 'from-gray-500/10 to-slate-500/10 border-gray-300/40';
  return 'from-slate-500/10 to-gray-500/10 border-slate-300/40';
}

function getRoleBadgeColor(role: string): string {
  const r = role.toLowerCase();
  if (r === 'president') return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/30';
  if (r === 'vice president') return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-400/30';
  if (r.includes('secretary')) return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30';
  if (r.includes('social media')) return 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-400/30';
  if (r.includes('technical') || r.includes('pr')) return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-400/30';
  if (r.includes('treasurer')) return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400/30';
  if (r === 'member') return 'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-300/30';
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
  if (r.includes('secretary')) return 'from-blue-400 to-cyan-500';
  if (r.includes('social media')) return 'from-pink-400 to-rose-500';
  if (r.includes('technical') || r.includes('pr')) return 'from-indigo-400 to-violet-500';
  if (r.includes('treasurer')) return 'from-emerald-400 to-teal-500';
  return 'from-slate-400 to-gray-500';
}

// ── Member Card Component ──

const MemberCardComponent = memo(function MemberCardComponent({ member, index }: { member: MemberCard; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 28 }}
        onClick={() => setExpanded(true)}
        className={`relative cursor-pointer rounded-2xl p-3 border bg-gradient-to-br ${getRoleColor(member.role)} backdrop-blur-xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
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

// ── Event Data Download Component ──

const EventDataComponent = memo(function EventDataComponent({ data }: { data: EventData }) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const downloadCSV = useCallback(() => {
    const headers = ['S.No', 'Student Name', 'Email', 'Roll No', 'Phone', 'Programme', 'Year', 'Section', 'Class Coordinator', 'Scan Time', 'Method'];
    const rows = data.attendees.map((a, i) => [
      i + 1, a.name, a.email, a.roll_no, a.phone, a.programme, a.year, a.section, a.class_coordinator,
      new Date(a.scanned_at).toLocaleString(), a.method,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.event_name.replace(/[^a-zA-Z0-9]/g, '_')}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
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
    setShowMenu(false);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{data.event_name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(data.event_date)} • {data.total_attendees} attendees</p>
          </div>
          <div className="relative">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl" onClick={() => setShowMenu(!showMenu)}>
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
                >
                  <button onClick={downloadCSV} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    Download CSV
                  </button>
                  <button onClick={downloadXLSX} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-muted transition-colors border-t border-border/50">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Download Excel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {data.attendees.length > 0 && (
          <div className="mt-3 p-2.5 rounded-xl bg-background/60 border border-border/30 max-h-40 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium mb-1.5">Attendees Preview</p>
            <div className="space-y-1">
              {data.attendees.slice(0, 10).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate flex-1">{a.name}</span>
                  <span className="text-muted-foreground text-[10px] ml-2">{a.method}</span>
                </div>
              ))}
              {data.attendees.length > 10 && (
                <p className="text-[10px] text-muted-foreground mt-1">+{data.attendees.length - 10} more attendees</p>
              )}
            </div>
          </div>
        )}
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
