import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Instagram, Linkedin, GraduationCap, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

interface ParsedContent {
  header?: string;
  subtext?: string;
  members: MemberCard[];
  remainingMarkdown: string;
}

function parseMemberResponse(content: string): ParsedContent {
  const members: MemberCard[] = [];

  // Check if this looks like a member directory response
  const memberPattern = /\d+\.\s*\*{0,2}(President|Vice President|Secretary|Social Media Head|Member|General Member)\*{0,2}/i;
  if (!memberPattern.test(content)) {
    return { members: [], remainingMarkdown: content };
  }

  // Extract header
  let header = '';
  let subtext = '';
  const headerMatch = content.match(/^#+\s*(.+?)[\n\r]/m) || content.match(/^\*{2}(.+?)\*{2}/m);
  if (headerMatch) {
    header = headerMatch[1].replace(/\*{2}/g, '').trim();
  }

  // Extract subtext (line after header, before first member)
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('**')) continue;
    if (/^\d+\./.test(trimmed)) break;
    if (trimmed.toLowerCase().includes('member') || trimmed.toLowerCase().includes('details') || trimmed.toLowerCase().includes('currently')) {
      subtext = trimmed.replace(/\*{2}/g, '').replace(/\*/g, '');
      break;
    }
  }

  // Split by numbered items
  const sections = content.split(/(?=\d+\.\s)/);
  for (const section of sections) {
    if (!section.trim()) continue;
    const roleMatch = section.match(/\d+\.\s*\*{0,2}(President|Vice President|Secretary|Social Media Head|Member|General Member)\*{0,2}/i);
    if (!roleMatch) continue;

    const getValue = (key: string): string => {
      const patterns = [
        new RegExp(`\\*{0,2}${key}:?\\*{0,2}\\s*(.+?)(?:\\n|$)`, 'i'),
        new RegExp(`-\\s*\\*{0,2}${key}:?\\*{0,2}\\s*(.+?)(?:\\n|$)`, 'i'),
      ];
      for (const p of patterns) {
        const m = section.match(p);
        if (m) return m[1].replace(/\*{2}/g, '').replace(/\[(.+?)\]\(.+?\)/g, '$1').trim();
      }
      return '';
    };

    const getLink = (key: string): string => {
      const linkMatch = section.match(new RegExp(`${key}:?.*?\\[.*?\\]\\((.+?)\\)`, 'i'));
      return linkMatch ? linkMatch[1] : '';
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

  if (members.length === 0) {
    return { members: [], remainingMarkdown: content };
  }

  return { header, subtext, members, remainingMarkdown: '' };
}

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

function MemberCardComponent({ member, index }: { member: MemberCard; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
        onClick={() => setExpanded(true)}
        className={`
          relative cursor-pointer rounded-2xl p-3 border
          bg-gradient-to-br ${getRoleColor(member.role)}
          backdrop-blur-xl shadow-sm
          hover:shadow-md hover:scale-[1.02]
          transition-all duration-200
        `}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
            {member.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{member.name || 'Unknown'}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${getRoleBadgeColor(member.role)}`}>
              {getRoleIcon(member.role)}
              {member.role}
            </span>
          </div>
          <div className="text-muted-foreground/50 text-xs">→</div>
        </div>
      </motion.div>

      {/* Expanded overlay */}
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
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(40px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
              }}
            >
              {/* Header gradient */}
              <div className="relative h-20 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 flex items-end px-5 pb-3">
                <button
                  onClick={() => setExpanded(false)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/30 backdrop-blur-md flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/20">
                    {member.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base drop-shadow-sm">{member.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/25 text-white border border-white/20">
                      {getRoleIcon(member.role)}
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-3">
                {member.programme && (
                  <DetailRow icon={<GraduationCap className="w-4 h-4 text-amber-500" />} label="Programme" value={member.programme} />
                )}
                {member.email && (
                  <DetailRow icon={<Mail className="w-4 h-4 text-amber-500" />} label="Email" value={member.email} href={`mailto:${member.email}`} />
                )}
                {member.phone && (
                  <DetailRow icon={<Phone className="w-4 h-4 text-amber-500" />} label="Phone" value={member.phone} href={`tel:${member.phone}`} />
                )}
                {member.instagram && member.instagram !== 'Not Provided' && (
                  <DetailRow icon={<Instagram className="w-4 h-4 text-amber-500" />} label="Instagram" value="View Profile" href={member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram}`} />
                )}
                {member.linkedin && member.linkedin !== 'Not Provided' && (
                  <DetailRow icon={<Linkedin className="w-4 h-4 text-amber-500" />} label="LinkedIn" value="View Profile" href={member.linkedin.startsWith('http') ? member.linkedin : `https://linkedin.com/in/${member.linkedin}`} />
                )}
                {member.gmail && member.gmail !== 'Not Provided' && (
                  <DetailRow icon={<Mail className="w-4 h-4 text-amber-500" />} label="Gmail" value={member.gmail} href={`mailto:${member.gmail}`} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function DetailRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/20">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-600 dark:text-amber-400 hover:underline truncate block">
            {value}
          </a>
        ) : (
          <p className="text-sm text-foreground truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
      {children}
    </a>
  ),
};

export function ChatResponseRenderer({ content }: { content: string }) {
  const parsed = parseMemberResponse(content);

  if (parsed.members.length === 0) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {parsed.header && (
        <p className="font-semibold text-sm text-foreground">{parsed.header}</p>
      )}
      {parsed.subtext && (
        <p className="text-xs text-muted-foreground">{parsed.subtext}</p>
      )}
      <div className="space-y-2 mt-1">
        {parsed.members.map((member, i) => (
          <MemberCardComponent key={i} member={member} index={i} />
        ))}
      </div>
      {parsed.remainingMarkdown && (
        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 mt-2">
          <ReactMarkdown components={markdownComponents}>{parsed.remainingMarkdown}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
