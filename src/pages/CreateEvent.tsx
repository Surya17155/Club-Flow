import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Download, ArrowLeft, ChevronDown, QrCode, ScanFace } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const EVENT_TYPES = ['Normal', 'Workshop', 'Industrial Visit', 'Hackathon', 'Guest Lecture', 'Competition'];
const LOCATIONS = ['Auditorium', 'Seminar Hall', 'Custom Location'];
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const nb = {
  card: {
    background: '#FFFDF9',
    border: '3px solid #111',
    boxShadow: '6px 6px 0px #111',
    borderRadius: '12px',
    fontFamily: "'Space Grotesk', sans-serif",
  } as React.CSSProperties,
  input: {
    background: '#FFF8F0',
    border: '2px solid #111',
    borderRadius: '8px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '14px',
    fontWeight: 600,
  } as React.CSSProperties,
  label: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '13px',
    color: '#111',
  } as React.CSSProperties,
  heading: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    color: '#111',
  } as React.CSSProperties,
  btnOrange: {
    background: '#E98A3A',
    border: '3px solid #111',
    boxShadow: '4px 4px 0px #111',
    borderRadius: '6px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    color: '#111',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  } as React.CSSProperties,
  btnBlack: {
    background: '#111',
    border: '3px solid #111',
    boxShadow: '4px 4px 0px #E98A3A',
    borderRadius: '6px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  } as React.CSSProperties,
  dropdown: {
    background: '#FFFDF9',
    border: '3px solid #111',
    boxShadow: '4px 4px 0px #111',
    borderRadius: '10px',
    fontFamily: "'Space Grotesk', sans-serif",
  } as React.CSSProperties,
};

const NBDropdown = ({
  label,
  value,
  options,
  onSelect,
  icon,
  placeholder,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5 relative">
      <label style={nb.label}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        style={nb.input}
      >
        {icon}
        <span className="flex-1 text-left" style={{ color: value ? '#111' : '#999' }}>{value || placeholder || 'Select...'}</span>
        <ChevronDown className="w-4 h-4" style={{ color: '#111' }} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 overflow-hidden" style={nb.dropdown}>
          <div className="p-1 space-y-0.5">
            {options.map((opt) => (
              <div
                key={opt}
                onClick={() => { onSelect(opt); setOpen(false); }}
                className="px-4 py-2 rounded-lg cursor-pointer text-sm transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: value === opt ? 700 : 500,
                  background: value === opt ? '#F6E1CF' : 'transparent',
                  color: '#111',
                  border: value === opt ? '2px solid #111' : '2px solid transparent',
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const NBTimePicker = ({
  label,
  hour, minute, period,
  onHourChange, onMinuteChange, onPeriodChange,
}: {
  label: string;
  hour: string; minute: string; period: 'AM' | 'PM';
  onHourChange: (v: string) => void;
  onMinuteChange: (v: string) => void;
  onPeriodChange: (v: 'AM' | 'PM') => void;
}) => {
  return (
    <div className="flex-1 space-y-1">
      <span style={{ ...nb.label, fontSize: '12px', color: '#555' }}>{label}</span>
      <div className="flex gap-1.5 items-center">
        <select
          value={hour}
          onChange={(e) => onHourChange(e.target.value)}
          className="px-2 py-2 text-sm appearance-none text-center"
          style={{ ...nb.input, width: '52px' }}
        >
          <option value="">--</option>
          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span style={{ fontWeight: 900, fontSize: '16px', color: '#111' }}>:</span>
        <select
          value={minute}
          onChange={(e) => onMinuteChange(e.target.value)}
          className="px-2 py-2 text-sm appearance-none text-center"
          style={{ ...nb.input, width: '52px' }}
        >
          <option value="">--</option>
          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex border-2 border-[#111] rounded-md overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <button
            type="button"
            onClick={() => onPeriodChange('AM')}
            className="px-2.5 py-1.5 text-xs font-bold transition-all"
            style={{
              background: period === 'AM' ? '#E98A3A' : '#FFF8F0',
              color: '#111',
            }}
          >AM</button>
          <button
            type="button"
            onClick={() => onPeriodChange('PM')}
            className="px-2.5 py-1.5 text-xs font-bold transition-all"
            style={{
              background: period === 'PM' ? '#E98A3A' : '#FFF8F0',
              color: '#111',
              borderLeft: '2px solid #111',
            }}
          >PM</button>
        </div>
      </div>
    </div>
  );
};

function to24(hour: string, minute: string, period: 'AM' | 'PM'): string {
  if (!hour || !minute) return '';
  let h = parseInt(hour);
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
}

const CreateEvent = () => {
  const { user } = useAuth();
  const { activeClub, loading: clubsLoading } = useClub();
  const { hasPower, loading: powersLoading } = useDelegatedPowers();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Normal');
  const [eventDate, setEventDate] = useState('');

  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('PM');

  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [openToAll, setOpenToAll] = useState(true);
  const [clubMembersOnly, setClubMembersOnly] = useState(false);
  const [attendanceGiven, setAttendanceGiven] = useState<boolean>(false);
  const [capacity, setCapacity] = useState('');
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [attendanceMode, setAttendanceMode] = useState<'qr' | 'face'>('qr');
  const [publishing, setPublishing] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  if (!user || (!activeClub && clubsLoading)) return null;

  if (!activeClub || (!powersLoading && !hasPower('create_event'))) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F4EFE7' }}>
        <div className="max-w-md bg-[#FFFDF9] border-[3px] border-[#111] rounded-[8px] p-6 text-center" style={{ boxShadow: '6px 6px 0px #111' }}>
          <h1 className="text-xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>Create Event Unavailable</h1>
          <p className="text-sm font-medium mb-5" style={{ color: '#555' }}>
            Select a club or ask the club president for event creation access.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 font-bold text-sm border-[3px] border-[#111] rounded-[6px] transition-all hover:translate-y-[2px]"
            style={{ background: '#E98A3A', color: '#111', boxShadow: '3px 3px 0px #111', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const startTime = to24(startHour, startMinute, startPeriod);
  const endTime = to24(endHour, endMinute, endPeriod);

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
      const now = new Date();
      const offsetMin = now.getTimezoneOffset();
      const sign = offsetMin <= 0 ? '+' : '-';
      const absOffset = Math.abs(offsetMin);
      const tzStr = `${sign}${String(Math.floor(absOffset / 60)).padStart(2, '0')}:${String(absOffset % 60).padStart(2, '0')}`;
      const dateTime = `${eventDate}T${startTime}:00${tzStr}`;
      const endDateTime = `${eventDate}T${endTime}:00${tzStr}`;
      const accessType = clubMembersOnly ? 'club_only' : openToAll ? 'open' : 'restricted';

      const { data: inserted, error } = await supabase.from('events').insert({
        name: eventName.trim(),
        event_type: eventType.toLowerCase().replace(/\s+/g, '_'),
        event_date: dateTime,
        end_date: endDateTime,
        club_id: activeClub.club_id,
        created_by: user.id,
        description: description.trim() || null,
        access_type: accessType,
        qr_token: attendanceMode === 'qr' ? qrToken : null,
        attendance_given: attendanceGiven,
        attendance_mode: attendanceMode,
      } as any).select('id').single();

      if (error) throw error;
      toast.success('Event published successfully!');
      if (attendanceMode === 'face' && inserted?.id) {
        setCreatedEventId(inserted.id);
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish event');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      className="min-h-screen text-[#111] overflow-x-hidden"
      style={{ background: '#F4EFE7', fontFamily: "'Space Grotesk', sans-serif", scrollbarWidth: 'none' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl tracking-tight" style={nb.heading}>
              Create New Event
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#555', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>
              Fill in the details below for{' '}
              <span className="font-bold" style={{ color: '#E98A3A' }}>{activeClub.club_name}</span>.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 flex items-center gap-2 text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
            style={nb.btnBlack}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </header>

        {/* Main grid */}
        <main className={cn("grid gap-5", isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
          {/* Column 1: Event Details */}
          <section className="p-5 flex flex-col gap-4" style={nb.card}>
            <h2 className="text-lg mb-1" style={nb.heading}>Event Details</h2>

            <div className="space-y-1.5">
              <label style={nb.label}>Event Name</label>
              <input
                className="w-full px-4 py-2.5"
                placeholder="e.g. Annual Tech Symposium"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={nb.input}
              />
            </div>

            <NBDropdown
              label="Event Type"
              value={eventType}
              options={EVENT_TYPES}
              onSelect={setEventType}
              placeholder="Select type"
            />

            {/* Date */}
            <div className="space-y-1.5">
              <label style={nb.label}>Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    style={nb.input}
                  >
                    <CalendarIcon className="w-4 h-4" style={{ color: '#E98A3A' }} />
                    <span style={{ color: eventDate ? '#111' : '#999' }}>
                      {eventDate ? format(parse(eventDate, 'yyyy-MM-dd', new Date()), 'PPP') : 'Select date'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 z-[100]"
                  align="start"
                  sideOffset={8}
                  style={{
                    ...nb.dropdown,
                    padding: '4px',
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

            {/* Time */}
            <div className="space-y-1.5">
              <label style={nb.label}>Event Time</label>
              <div className="flex flex-col gap-3">
                <NBTimePicker
                  label="Start"
                  hour={startHour} minute={startMinute} period={startPeriod}
                  onHourChange={setStartHour} onMinuteChange={setStartMinute} onPeriodChange={setStartPeriod}
                />
                <NBTimePicker
                  label="End"
                  hour={endHour} minute={endMinute} period={endPeriod}
                  onHourChange={setEndHour} onMinuteChange={setEndMinute} onPeriodChange={setEndPeriod}
                />
              </div>
            </div>

            {/* Location */}
            <NBDropdown
              label="Location / Platform"
              value={location}
              options={LOCATIONS}
              onSelect={(loc) => {
                if (loc === 'Custom Location') {
                  setIsCustomLocation(true);
                  setLocation('');
                } else {
                  setIsCustomLocation(false);
                  setLocation(loc);
                }
              }}
              icon={<MapPin className="w-4 h-4" style={{ color: '#E98A3A' }} />}
              placeholder="Select location"
            />
            {isCustomLocation && (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#E98A3A' }} />
                <input
                  className="w-full pl-10 pr-4 py-2.5"
                  placeholder="Enter custom location..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  autoFocus
                  style={nb.input}
                />
              </div>
            )}
          </section>

          {/* Column 2: Participant Settings */}
          <section className="p-5 flex flex-col gap-4" style={nb.card}>
            <h2 className="text-lg mb-1" style={nb.heading}>Participant Settings</h2>

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#FFF8F0', border: '2px solid #111' }}>
              <span style={{ ...nb.label, fontSize: '14px' }}>Open to All Students</span>
              <Switch
                checked={openToAll}
                onCheckedChange={(val) => { setOpenToAll(val); if (val) setClubMembersOnly(false); }}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#FFF8F0', border: '2px solid #111' }}>
              <span style={{ ...nb.label, fontSize: '14px' }}>Club Members Only</span>
              <Switch
                checked={clubMembersOnly}
                onCheckedChange={(val) => { setClubMembersOnly(val); if (val) setOpenToAll(false); }}
              />
            </div>

            <div className="p-3 rounded-lg" style={{ background: '#F6E1CF', border: '2px solid #111' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span style={{ ...nb.label, fontSize: '14px' }}>Attendance Will Be Given</span>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>Students will see if attendance is recorded</p>
                </div>
                <Switch
                  checked={attendanceGiven}
                  onCheckedChange={(val) => setAttendanceGiven(val)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label style={nb.label}>
                Audience Capacity <span style={{ color: '#999', fontWeight: 500, fontSize: '12px' }}>(optional)</span>
              </label>
              <input
                type="number"
                className="w-full px-4 py-2.5"
                placeholder="e.g. 100"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                style={nb.input}
              />
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label style={nb.label}>
                Description <span style={{ color: '#999', fontWeight: 500, fontSize: '12px' }}>(optional)</span>
              </label>
              <textarea
                className="w-full px-4 py-2.5 flex-1 min-h-[100px] resize-none"
                placeholder="Describe your event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={nb.input}
              />
            </div>
          </section>

          {/* Column 3: Attendance Method */}
          <section className="p-5 flex flex-col gap-4" style={nb.card}>
            <h2 className="text-lg mb-1" style={nb.heading}>Attendance Method</h2>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setAttendanceMode('qr'); }}
                className="py-3 text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  ...nb.btnOrange,
                  background: attendanceMode === 'qr' ? '#E98A3A' : '#FFF8F0',
                  boxShadow: attendanceMode === 'qr' ? '4px 4px 0 #111' : '2px 2px 0 #111',
                }}
              >
                <QrCode className="w-4 h-4" /> QR Code
              </button>
              <button
                type="button"
                onClick={() => { setAttendanceMode('face'); setQrToken(null); }}
                className="py-3 text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  ...nb.btnOrange,
                  background: attendanceMode === 'face' ? '#E98A3A' : '#FFF8F0',
                  boxShadow: attendanceMode === 'face' ? '4px 4px 0 #111' : '2px 2px 0 #111',
                }}
              >
                <ScanFace className="w-4 h-4" /> Face ID
              </button>
            </div>

            {attendanceMode === 'qr' && (
              <>
                <div
                  className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl"
                  style={{ background: '#FFF8F0', border: '2px dashed #111' }}
                >
                  {qrToken ? (
                    <div className="qr-code-container p-4 rounded-xl" style={{ background: '#fff', border: '3px solid #111', boxShadow: '4px 4px 0px #111' }}>
                      <QRCodeSVG value={`${window.location.origin}/mark-attendance/${qrToken}`} size={140} />
                    </div>
                  ) : (
                    <div className="text-center">
                      <QrCode className="w-14 h-14 mx-auto mb-3" style={{ color: '#ccc' }} />
                      <p className="text-sm" style={{ color: '#999', fontWeight: 500 }}>Click below to generate a QR code</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={generateQR}
                  className="w-full py-2.5 text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                  style={nb.btnOrange}
                >
                  Generate QR Code
                </button>

                {qrToken && (
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
                    style={nb.btnBlack}
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
                    }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download QR Code</span>
                  </button>
                )}
              </>
            )}

            {attendanceMode === 'face' && (
              <div
                className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl text-center"
                style={{ background: '#FFF8F0', border: '2px dashed #111' }}
              >
                <ScanFace className="w-14 h-14 mb-3" style={{ color: '#E98A3A' }} />
                <p className="text-sm font-bold mb-1" style={{ color: '#111' }}>Face ID Attendance</p>
                <p className="text-xs" style={{ color: '#555' }}>
                  No QR needed. Open the live scanner from this event after publishing to mark attendance by face.
                </p>
              </div>
            )}
          </section>
        </main>

        {/* Post-publish Face ID success */}
        {createdEventId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div style={{ ...nb.card, padding: '24px', maxWidth: '420px', width: '100%' }} className="text-center">
              <ScanFace className="w-12 h-12 mx-auto mb-3" style={{ color: '#E98A3A' }} />
              <h3 className="text-lg font-black mb-2" style={nb.heading}>Face ID enabled</h3>
              <p className="text-sm mb-5" style={{ color: '#555' }}>
                Open the live scanner now or later from the event.
              </p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/admin')} className="flex-1 py-2.5 text-sm" style={nb.btnBlack}>
                  Done
                </button>
                <button
                  onClick={() => navigate(`/events/${createdEventId}/face-scan`)}
                  className="flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                  style={nb.btnOrange}
                >
                  <ScanFace className="w-4 h-4" /> Open Scanner
                </button>
              </div>
            </div>
          </div>
        )}

        </main>

        {/* Publish Button */}
        <div className="flex justify-center mt-8 pb-8">
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-10 py-4 text-base disabled:opacity-50 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
            style={{
              ...nb.btnOrange,
              boxShadow: '6px 6px 0px #111',
              fontSize: '16px',
              borderRadius: '12px',
            }}
          >
            {publishing ? (
              <div className="w-5 h-5 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
            ) : (
              <CalendarIcon className="w-5 h-5" />
            )}
            {publishing ? 'Publishing...' : 'Publish Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
