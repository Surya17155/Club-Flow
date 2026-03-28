import * as XLSX from 'xlsx';

interface AttendeeRow {
  full_name: string;
  roll_no: string | null;
  phone: string | null;
  programme: string | null;
  section: string | null;
  year?: string | null;
  scanned_at: string;
  status: string;
  manually_added?: boolean | null;
}

export const exportAttendanceXLSX = (
  attendees: AttendeeRow[],
  eventName: string,
  eventDate: string
) => {
  const data = attendees.map((a, i) => ({
    'S.No': i + 1,
    'Student Name': a.full_name,
    'Roll No': a.roll_no || '—',
    'Phone': a.phone || '—',
    'Programme': a.programme || '—',
    'Year': a.year || '—',
    'Section': a.section || '—',
    'Scan Time': new Date(a.scanned_at).toLocaleString(),
    'Status': a.status === 'present' ? 'Present' : a.status,
    'Method': a.manually_added ? 'Manual' : 'QR Scan',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  
  // Auto-width columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String((row as any)[key]).length)) + 2
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

  const fileName = `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date(eventDate).toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
