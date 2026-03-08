import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Trash2, Eye, QrCode } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const EVENT_TYPES = ['Workshop', 'Seminar', 'Industrial Visit', 'Guest Lecture', 'Meeting', 'Hackathon', 'Festival'];
const CATEGORIES = ['Mandatory', 'Optional', 'Selective'];
const ACCESS_TYPES = ['Open to College', 'Open to Club', 'Restricted'];

const mockEvents = [
  { id: '1', name: 'Coding Workshop', type: 'Workshop', category: 'Mandatory', date: '2025-10-28', time: '10:00 AM', attendees: 45, status: 'upcoming' },
  { id: '2', name: 'Hackathon 2025', type: 'Hackathon', category: 'Optional', date: '2025-11-05', time: '9:00 AM', attendees: 80, status: 'upcoming' },
  { id: '3', name: 'Guest Lecture: AI', type: 'Guest Lecture', category: 'Mandatory', date: '2025-11-12', time: '2:00 PM', attendees: 120, status: 'upcoming' },
  { id: '4', name: 'Web Dev Bootcamp', type: 'Workshop', category: 'Optional', date: '2025-10-20', time: '11:00 AM', attendees: 35, status: 'completed' },
];

const Events = () => {
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Events</h1>
            <p className="text-sm text-muted-foreground">Manage and view all club events</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gradient-gold text-primary-foreground shadow-gold hover:opacity-90">
                <Plus className="w-4 h-4 mr-1" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Event</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); toast({ title: 'Event created!', description: 'Your event has been created successfully.' }); }}>
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input placeholder="e.g., Coding Workshop" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Access Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select access" /></SelectTrigger>
                    <SelectContent>{ACCESS_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the event..." />
                </div>
                <Button type="submit" className="w-full gradient-gold text-primary-foreground">Create Event</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {['all', 'upcoming', 'completed'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'gradient-gold text-primary-foreground' : ''}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockEvents
            .filter(e => filter === 'all' || e.status === filter)
            .map(event => (
              <Card key={event.id} className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-display">{event.name}</CardTitle>
                      <div className="flex gap-1.5 mt-1.5">
                        <Badge variant="outline" className="text-xs">{event.type}</Badge>
                        <Badge className={`text-xs ${event.category === 'Mandatory' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}`} variant="outline">
                          {event.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'} className={event.status === 'upcoming' ? 'gradient-gold text-primary-foreground border-0' : ''}>
                      {event.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{event.attendees} attendees</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1"><Eye className="w-3.5 h-3.5 mr-1" /> View</Button>
                    <Button variant="outline" size="sm"><QrCode className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Events;
