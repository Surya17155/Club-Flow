import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Download, ArrowLeft, ChevronDown, QrCode } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Navigate, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const EVENT_TYPES = ['Normal', 'Seminar', 'Workshop', 'Industrial Visit', 'Hackathon', 'Guest Lecture'];
const LOCATIONS = ['Auditorium', 'Seminar Hall', 'Custom Location'];

const CreateEvent = () => {
  const { user, loading } = useAuth();
  const { activeClub } = useClub();
  const { hasPower } = useDelegatedPowers();
  const navigate = useNavigate();

  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Normal');
  
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [openToAll, setOpenToAll] = useState(true);
  const [clubMembersOnly, setClubMembersOnly] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-warm">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>);

  }

  if (!user) return <Navigate to="/" replace />;
  if (!activeClub) return <Navigate to="/admin" replace />;
  if (!hasPower('create_event')) return <Navigate to="/admin" replace />;

  const validateMandatoryFields = (): boolean => {
    if (!eventName.trim()) { toast.error('Event name is required'); return false; }
    if (!eventType) { toast.error('Event type is required'); return false; }
    if (!eventDate) { toast.error('Start date is required'); return false; }
    if (!startTime) { toast.error('Start time is required'); return false; }
    if (!endTime) { toast.error('End time is required'); return false; }
    if (startTime && endTime && startTime >= endTime) { toast.error('End time must be after start time'); return false; }
    return true;
  };

  const generateQR = () => {
    if (!validateMandatoryFields()) return;
    const token = crypto.randomUUID();
    setQrToken(token);
    toast.success('QR Code generated!');
  };

  const handlePublish = async () => {
    if (!validateMandatoryFields()) return;

    setPublishing(true);
    try {
      const dateTime = `${eventDate}T${startTime}:00`;
      const endDateTime = `${eventDate}T${endTime}:00`;
      const accessType = clubMembersOnly ? 'club_only' : openToAll ? 'open' : 'restricted';

      const { error } = await supabase.from('events').insert({
        name: eventName.trim(),
        event_type: eventType.toLowerCase().replace(/\s+/g, '_'),
        
        event_date: dateTime,
        end_date: endDateTime,
        club_id: activeClub.club_id,
        created_by: user.id,
        description: description.trim() || null,
        access_type: accessType,
        qr_token: qrToken
      });

      if (error) throw error;
      toast.success('Event published successfully!');
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish event');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen relative antialiased dashboard-corner-gradient text-foreground">
      {/* Background blobs - matching main theme */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-8%] left-[-8%] w-[550px] h-[550px] rounded-full mix-blend-multiply filter blur-[100px] opacity-80 animate-blob" style={{ backgroundColor: 'hsl(45 90% 85% / 0.9)' }} />
        <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full mix-blend-multiply filter blur-[90px] opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: 'hsl(25 80% 82% / 0.8)' }} />
        <div className="absolute bottom-[-8%] left-[-5%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000" style={{ backgroundColor: 'hsl(35 75% 78% / 0.6)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" style={{ backgroundColor: 'hsl(28 70% 70% / 0.45)', animationDelay: '3s' }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full filter blur-[120px] opacity-30" style={{ backgroundColor: 'hsl(40 80% 88%)' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-display">
              Create New Event
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Fill in the details below to organize your next event for{' '}
              <span className="font-semibold text-primary">{activeClub.club_name}</span>.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="glass-card px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-accent/60 transition-all text-foreground font-medium text-sm group">
            
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </button>
        </header>

        {/* Main 3-column grid */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Event Details */}
          <section className="glass-card rounded-3xl p-6 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-foreground mb-1">Event Details</h2>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/90">Event Name</label>
              <input
                className="glass-input w-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                placeholder="e.g. Annual Tech Symposium"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)} />
              
            </div>

            {/* Event Type */}
            <div className="space-y-1.5 relative">
              <label className="block text-sm font-medium text-foreground/90">Event Type</label>
              <button
                type="button"
                onClick={() => {setShowTypeDropdown(!showTypeDropdown);setShowCategoryDropdown(false);}}
                className="glass-input w-full px-4 py-2.5 text-foreground flex justify-between items-center cursor-pointer rounded-lg">
                
                <span>{eventType}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              {showTypeDropdown &&
              <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-lg border border-border/30" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(32px) saturate(1.3)', WebkitBackdropFilter: 'blur(32px) saturate(1.3)' }}>
                  <div className="p-1 space-y-0.5">
                    {EVENT_TYPES.map((type) =>
                  <div
                    key={type}
                    onClick={() => {setEventType(type);setShowTypeDropdown(false);}}
                    className={`px-4 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                    eventType === type ?
                    'bg-primary/15 text-foreground font-medium' :
                    'hover:bg-accent/40 text-muted-foreground'}`
                    }>
                    
                        {type}
                      </div>
                  )}
                  </div>
                </div>
              }
            </div>


            {/* Date & Time */}
             <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/90">Start Date & Time</label>
              <div className="flex gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "glass-input flex-grow flex items-center gap-2 pl-3 pr-3 py-2.5 text-foreground rounded-lg text-left text-sm",
                        !eventDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      {eventDate ? format(parse(eventDate, 'yyyy-MM-dd', new Date()), 'PPP') : 'Select date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 border-border/30 rounded-2xl overflow-hidden z-[100]"
                    align="start"
                    sideOffset={8}
                    style={{
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(32px) saturate(1.3)',
                      WebkitBackdropFilter: 'blur(32px) saturate(1.3)',
                    }}
                  >
                    <Calendar
                      mode="single"
                      selected={eventDate ? parse(eventDate, 'yyyy-MM-dd', new Date()) : undefined}
                      onSelect={(date) => setEventDate(date ? format(date, 'yyyy-MM-dd') : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Start & End Time */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/90">Event Time</label>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Start Time</span>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="time"
                      className="glass-input w-full pl-10 pr-3 py-2.5 text-foreground rounded-lg text-sm"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">End Time</span>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="time"
                      className="glass-input w-full pl-10 pr-3 py-2.5 text-foreground rounded-lg text-sm"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5 relative">
              <label className="block text-sm font-medium text-foreground/90">Location / Platform</label>
              <button
                type="button"
                onClick={() => { setShowLocationDropdown(!showLocationDropdown); setShowTypeDropdown(false); setShowCategoryDropdown(false); }}
                className="glass-input w-full px-4 py-2.5 text-foreground flex items-center gap-2 cursor-pointer rounded-lg">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-left">{location || 'Select location'}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              {showLocationDropdown && (
                <div
                  className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-lg border border-border/30"
                  style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(32px) saturate(1.3)', WebkitBackdropFilter: 'blur(32px) saturate(1.3)' }}>
                  <div className="p-1 space-y-0.5">
                    {LOCATIONS.map((loc) => (
                      <div
                        key={loc}
                        onClick={() => {
                          if (loc === 'Custom Location') {
                            setIsCustomLocation(true);
                            setLocation('');
                          } else {
                            setIsCustomLocation(false);
                            setLocation(loc);
                          }
                          setShowLocationDropdown(false);
                        }}
                        className={`px-4 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                          location === loc ? 'bg-primary/15 text-foreground font-medium' : 'hover:bg-accent/40 text-muted-foreground'
                        }`}>
                        {loc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isCustomLocation && (
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                    placeholder="Enter custom location..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    autoFocus />
                </div>
              )}
            </div>
          </section>

          {/* Column 2: Participant Settings & Description */}
          <section className="glass-card rounded-3xl p-6 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-foreground mb-1">Participant Settings</h2>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Open to All Students</span>
              <Switch
                checked={openToAll}
                onCheckedChange={(val) => {setOpenToAll(val);if (val) setClubMembersOnly(false);}} />
              
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Club Members Only</span>
              <Switch
                checked={clubMembersOnly}
                onCheckedChange={(val) => {setClubMembersOnly(val);if (val) setOpenToAll(false);}} />
              
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground/90">
                Audience Capacity <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <input
                type="number"
                className="glass-input w-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                placeholder="e.g. 100"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)} />
              
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="block text-sm font-medium text-foreground/90">
                Description <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <textarea
                className="glass-input w-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 rounded-lg flex-1 min-h-[120px] resize-none"
                placeholder="Describe your event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)} />
              
            </div>
          </section>

          {/* Column 3: QR Code */}
          <section className="glass-card rounded-3xl p-6 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-foreground mb-1">Attendance & QR</h2>

            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-accent/10 backdrop-blur-md rounded-[24px] border border-border/40 shadow-inner">
              {qrToken ?
              <div className="qr-code-container bg-background p-4 rounded-2xl shadow-xl ring-1 ring-border/20">
                  <QRCodeSVG value={qrToken} size={160} />
                </div> :

              <div className="text-center text-muted-foreground">
                  <QrCode className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Click the button below to generate a QR code</p>
                </div>
              }
            </div>

            <button
              type="button"
              onClick={generateQR}
              className="w-full gradient-gold text-primary-foreground font-bold py-2.5 rounded-xl transition-all shadow-gold hover:shadow-elevated hover:-translate-y-0.5 font-display text-sm">
              
              Generate QR Code
            </button>

            {qrToken &&
            <button
              type="button"
              className="glass-card w-full flex items-center justify-center gap-2 py-3.5 hover:bg-accent/60 transition-all text-foreground font-semibold rounded-xl"
              onClick={() => {
                const svg = document.querySelector('.qr-code-container svg') as SVGElement;
                if (!svg) { toast.error('QR code not found'); return; }
                const canvas = document.createElement('canvas');
                const size = 320;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d')!;
                const svgData = new XMLSerializer().serializeToString(svg);
                const img = new Image();
                img.onload = () => {
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, size, size);
                  ctx.drawImage(img, 0, 0, size, size);
                  const link = document.createElement('a');
                  link.download = `qr-code-${eventName || 'event'}.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
                  toast.success('QR Code downloaded!');
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
              }}>
              
                <Download className="w-4 h-4" />
                <span className="text-sm">Download QR Code</span>
              </button>
            }
          </section>
        </main>

        {/* Publish Button - properly placed below the grid */}
        <div className="flex justify-center mt-8 pb-8">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 gradient-gold text-primary-foreground px-8 py-4 rounded-full shadow-lg transform hover:-translate-y-1 transition-all duration-300 font-bold text-base disabled:opacity-50">
            
            {publishing ?
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> :

            <CalendarIcon className="w-5 h-5" />
            }
            {publishing ? 'Publishing...' : 'Publish Event'}
          </button>
        </div>
      </div>
    </div>);

};

export default CreateEvent;