import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';

export interface ChatFile {
  name: string;
  type: string;
  storageUrl?: string;
  parsedData?: { headers: string[]; rows: any[] };
}

const ACCEPTED_TYPES = '.xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg';
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export function useChatFileUpload() {
  const [file, setFile] = useState<ChatFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE) {
      toast({ title: 'File too large', description: 'Max 20MB', variant: 'destructive' });
      return;
    }
    setUploading(true);

    try {
      // For Excel/CSV, parse client-side
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
        const data = await f.arrayBuffer();
        const wb = XLSX.read(data);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        const headers = (jsonData[0] || []).map(String);
        const rows = jsonData.slice(1).filter(r => r.some(v => v != null && v !== ''));
        setFile({ name: f.name, type: f.type || 'application/octet-stream', parsedData: { headers, rows } });
      } else {
        // Upload to storage for PDF/images
        const path = `${Date.now()}_${f.name}`;
        const { error } = await supabase.storage.from('chat-uploads').upload(path, f);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('chat-uploads').getPublicUrl(path);
        setFile({ name: f.name, type: f.type, storageUrl: urlData.publicUrl });
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clearFile = () => setFile(null);

  return { file, uploading, inputRef, openPicker, handleFileSelect, clearFile, acceptedTypes: ACCEPTED_TYPES };
}
