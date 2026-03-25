import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Twitter } from 'lucide-react';
import VerifiedBadge, { getRoleBadgeVariant } from '@/components/ui/VerifiedBadge';

interface ProfileCardProps {
  name: string;
  role: string;
  rawRole?: string;
  avatarUrl?: string;
  about?: string;
  className?: string;
  programme?: string;
  semester?: string;
  year?: string;
  socialLinks?: {github?: string;linkedin?: string;twitter?: string;};
  badges?: string[];
}

export function ProfileCard({
  name,
  role,
  rawRole,
  avatarUrl,
  about,
  programme,
  semester,
  year,
  socialLinks,
  badges,
  className
}: ProfileCardProps) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card className={`p-5 shadow-card border-border/50 ${className || ''}`}>
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 mb-3 ring-4 ring-primary/20">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-lg font-display font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-display font-bold text-foreground flex items-center justify-center">
          {name}
          {rawRole && getRoleBadgeVariant(rawRole) && (
            <VerifiedBadge variant={getRoleBadgeVariant(rawRole)!} size={16} />
          )}
        </h3>
        <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-0 font-medium">
          {role}
        </Badge>

        {badges && badges.length > 0 &&
        <div className="flex flex-wrap gap-1 mt-2 justify-center">
            {badges.map((badge, i) =>
          <Badge key={i} variant="outline" className="text-xs">{badge}</Badge>
          )}
          </div>
        }

        {about &&
        <div className="mt-4 w-full text-left">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">About</h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{about}</p>
          </div>
        }

        {(programme || year || semester) &&
        <div className="mt-4 w-full text-left space-y-1">
            {year &&
          <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">​Year</span>
                <span className="font-medium">{year}</span>
              </div>
          }
            {programme &&
          <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Program:</span>
                <span className="font-medium">{programme}</span>
              </div>
          }
            {semester &&
          <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Semester:</span>
                <span className="font-medium">{semester}</span>
              </div>
          }
          </div>
        }

        {socialLinks &&
        <div className="flex gap-3 mt-4">
            {socialLinks.github &&
          <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-4 h-4" />
              </a>
          }
            {socialLinks.linkedin &&
          <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
          }
            {socialLinks.twitter &&
          <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
          }
          </div>
        }
      </div>
    </Card>);

}