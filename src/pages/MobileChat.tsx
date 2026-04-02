import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Paperclip, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ChatResponseRenderer } from '@/components/chat/ChatResponseRenderer';
import { useChatFileUpload } from '@/hooks/useChatFileUpload';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/club-chat`;

const SUPER_ADMIN_EMAIL = 'suryakant.gnbba2029@iilm.edu';

const MobileChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user } = useAuth();
  const { activeClub } = useClub();
  const isSuperAdminMode = location.state?.superAdmin === true;
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL && isSuperAdminMode;
  const effectiveClubId = isSuperAdmin ? undefined : activeClub?.club_id;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { file, uploading, inputRef, openPicker, handleFileSelect, clearFile, acceptedTypes } = useChatFileUpload();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFormSubmit = (data: any) => {
    const details = Object.entries(data)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    setInput(`Add this member with these details: ${details}`);
    setTimeout(() => send(), 100);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !file) || loading || !session?.access_token) return;

    const displayText = file ? `${text || 'Process this file'} 📎 ${file.name}` : text;
    const userMsg: Msg = { role: 'user', content: displayText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let assistantSoFar = '';
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    try {
      const body: any = {
        message: text || 'Process this file',
        conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
        active_club_id: effectiveClubId || undefined,
      };
      if (file?.parsedData) { body.file_data = file.parsedData; body.file_name = file.name; }
      else if (file?.storageUrl) { body.file_urls = [file.storageUrl]; body.file_name = file.name; }
      clearFile();

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Request failed' }));
        toast({ title: 'Chat Error', description: err.error || 'Something went wrong', variant: 'destructive' });
        setLoading(false);
        return;
      }

      if (!resp.body) throw new Error('No response body');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      console.error('Chat stream error:', e);
      toast({ title: 'Chat Error', description: 'Failed to connect to assistant', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm safe-area-top shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Bot className="w-5 h-5 text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">ClubBot</p>
          <p className="text-xs text-muted-foreground">AI Assistant</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-16">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium mb-1">Hi! I'm ClubBot</p>
            <p>Ask me anything about your club — members, events, attendance, and more.</p>
            <p className="text-xs mt-2 opacity-70">📎 You can also upload Excel, PDF, or image files</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && <Bot className="w-5 h-5 mt-1 text-primary shrink-0" />}
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
              {msg.role === 'assistant' ? <ChatResponseRenderer content={msg.content} /> : msg.content}
            </div>
            {msg.role === 'user' && <User className="w-5 h-5 mt-1 text-muted-foreground shrink-0" />}
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <Bot className="w-5 h-5 mt-1 text-primary shrink-0" />
            <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {file && (
        <div className="px-3 pt-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs flex-1 min-w-0">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{file.name}</span>
          </div>
          <button onClick={clearFile} className="p-1 rounded hover:bg-muted"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      )}

      <div className="px-3 pt-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <div className="flex gap-2 items-end">
          <input ref={inputRef} type="file" accept={acceptedTypes} onChange={handleFileSelect} className="hidden" />
          <Button variant="ghost" size="icon" className="shrink-0 h-10 w-10" onClick={openPicker} disabled={uploading || loading}>
            <Paperclip className="w-4 h-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about your club..."
            disabled={loading}
            className="text-sm min-h-[40px] max-h-[120px] resize-none rounded-xl"
            rows={1}
          />
          <Button size="icon" onClick={send} disabled={loading || (!input.trim() && !file)} className="shrink-0 rounded-xl h-10 w-10">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileChat;
