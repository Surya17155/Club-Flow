import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Download, ArrowLeft, ChevronDown, QrCode } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  clubName: string;
}

const EVENT_TYPES = ['Normal', 'Seminar', 'Workshop', 'Industrial Visit', 'Hackathon', 'Guest Lecture'];
const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Academic', 'Social'];

const CreateEventModal = ({ open, onOpenChange, clubId, clubName }: CreateEventModalProps) => {
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Normal');
  const [category, setCategory] = useState('Technical');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [openToAll, setOpenToAll] = useState(true);
  const [clubMembersOnly, setClubMembersOnly] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const generateQR = () => {
    const token = crypto.randomUUID();
    setQrToken(token);
    toast.success('QR Code generated!');
  };

  const handlePublish = async () => {
    if (!eventName.trim()) { toast.error('Event name is required'); return; }
    if (!eventDate) { toast.error('Event date is required'); return; }
    if (!user) { toast.error('You must be logged in'); return; }

    setPublishing(true);
    try {
      const dateTime = eventTime ? `${eventDate}T${eventTime}:00` : `${eventDate}T00:00:00`;
      const accessType = clubMembersOnly ? 'club_only' : openToAll ? 'open' : 'restricted';

      const { error } = await supabase.from('events').insert({
        name: eventName.trim(),
        event_type: eventType.toLowerCase().replace(/\s+/g, '_'),
        category: category.toLowerCase(),
        event_date: dateTime,
        end_date: endDate ? `${endDate}T23:59:59` : null,
        club_id: clubId,
        created_by: user.id,
        description: description.trim() || null,
        access_type: accessType,
        qr_token: qrToken,
      });

      if (error) throw error;
      toast.success('Event published successfully!');
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish event');
    } finally {
      setPublishing(false);
    }
  };

  const resetForm = () => {
    setEventName(''); setEventType('Normal'); setCategory('Technical');
    setEventDate(''); setEventTime(''); setEndDate('');
    setLocation(''); setDescription('');
    setOpenToAll(true); setClubMembersOnly(false);
    setCapacity(''); setQrToken(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] p-0 border-none bg-transparent shadow-none [&>button]:hidden overflow-y-auto max-h-[95vh]">
        <div className="p-6 md:p-8">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Create New Event</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Fill in the details below to organize your next event for <span className="font-semibold text-primary">{clubName}</span>.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="glass-card px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-white/60 transition-all text-foreground font-medium text-sm group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Dashboard
            </button>
          </header>

          {/* Main 3-column grid */}
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
            {/* Column 1: Event Details */}
            <section className="glass-card rounded-3xl p-6 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-foreground mb-1">Event Details</h2>

              {/* Event Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/90">Event Name</label>
                <input
                  className="glass-input w-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                  placeholder="e.g. Annual Tech Symposium"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              {/* Event Type */}
              <div className="space-y-1.5 relative">
                <label className="block text-sm font-medium text-foreground/90">Event Type</label>
                <button
                  type="button"
                  onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowCategoryDropdown(false); }}
                  className="glass-input w-full px-4 py-2.5 text-foreground flex justify-between items-center cursor-pointer rounded-lg"
                >
                  <span>{eventType}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                {showTypeDropdown && (
                  <div className="absolute z-50 w-full mt-1 glass-card rounded-xl overflow-hidden shadow-lg">
                    <div className="p-1 space-y-0.5">
                      {EVENT_TYPES.map((type) => (
                        <div
                          key={type}
                          onClick={() => { setEventType(type); setShowTypeDropdown(false); }}
                          className={`px-4 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                            eventType === type
                              ? 'bg-primary/15 text-foreground font-medium'
                              : 'hover:bg-white/40 text-muted-foreground'
                          }`}
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5 relative">
                <label className="block text-sm font-medium text-foreground/90">Category</label>
                <button
                  type="button"
                  onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowTypeDropdown(false); }}
                  className="glass-input w-full px-4 py-2.5 text-foreground flex justify-between items-center cursor-pointer rounded-lg"
                >
                  <span>{category}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                {showCategoryDropdown && (
                  <div className="absolute z-50 w-full mt-1 glass-card rounded-xl overflow-hidden shadow-lg">
                    <div className="p-1 space-y-0.5">
                      {CATEGORIES.map((cat) => (
                        <div
                          key={cat}
                          onClick={() => { setCategory(cat); setShowCategoryDropdown(false); }}
                          className={`px-4 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                            category === cat
                              ? 'bg-primary/15 text-foreground font-medium'
                              : 'hover:bg-white/40 text-muted-foreground'
                          }`}
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/90">Start Date & Time</label>
                <div className="flex gap-3">
                  <div className="relative flex-grow">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      className="glass-input w-full pl-10 pr-3 py-2.5 text-foreground rounded-lg"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                  </div>
                  <div className="relative w-[120px]">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="time"
                      className="glass-input w-full pl-10 pr-3 py-2.5 text-foreground rounded-lg"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/90">End Date <span className="text-muted-foreground text-xs">(optional)</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    className="glass-input w-full pl-10 pr-3 py-2.5 text-foreground rounded-lg"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/90">Location / Platform</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                    placeholder="e.g. Hall A, Main Lab"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Column 2: Participant Settings & Description */}
            <section className="glass-card rounded-3xl p-6 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-foreground mb-1">Participant Settings</h2>

              {/* Toggle: Open to All */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Open to All Students</span>
                <Switch
                  checked={openToAll}
                  onCheckedChange={(val) => { setOpenToAll(val); if (val) setClubMembersOnly(false); }}
                />
              </div>

              {/* Toggle: Club Members Only */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Club Members Only</span>
                <Switch
                  checked={clubMembersOnly}
                  onCheckedChange={(val) => { setClubMembersOnly(val); if (val) setOpenToAll(false); }}
                />
              </div>

              {/* Capacity */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground/90">Audience Capacity <span className="text-muted-foreground text-xs">(optional)</span></label>
                <input
                  type="number"
                  className="glass-input w-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                  placeholder="e.g. 100"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="block text-sm font-medium text-foreground/90">Description <span className="text-muted-foreground text-xs">(optional)</span></label>
                <textarea
                  className="glass-input w-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 rounded-lg flex-1 min-h-[120px] resize-none"
                  placeholder="Describe your event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </section>

            {/* Column 3: QR Code */}
            <section className="glass-card rounded-3xl p-6 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-foreground mb-1">Attendance & QR</h2>

              <button
                type="button"
                onClick={generateQR}
                className="w-full bg-white/40 hover:bg-white/60 text-foreground font-medium py-2.5 rounded-xl border border-white/50 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Generate Attendance QR Code
              </button>

              {/* QR Display */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-md rounded-[24px] border border-white/40 shadow-inner">
                {qrToken ? (
                  <div className="bg-white p-4 rounded-2xl shadow-xl ring-1 ring-black/5">
                    <QRCodeSVG value={qrToken} size={160} />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <QrCode className="w-16 h-16 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Click the button above to generate a QR code</p>
                  </div>
                )}
              </div>

              {qrToken && (
                <button
                  type="button"
                  className="glass-card w-full flex items-center justify-center gap-2 py-3.5 hover:bg-white/60 transition-all text-foreground font-semibold rounded-xl"
                  onClick={() => {
                    const svg = document.querySelector('.qr-download-target svg');
                    toast.info('Right-click the QR code to save it as an image');
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download QR Code</span>
                </button>
              )}
            </section>
          </main>

          {/* Floating Publish Button */}
          <div className="fixed bottom-8 right-8 z-50">
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 gradient-gold text-primary-foreground px-8 py-4 rounded-full shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-bold text-base disabled:opacity-50"
            >
              {publishing ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
              {publishing ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
