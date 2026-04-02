import { useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { Send, Bot, User, Paperclip, FileText, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { toast } from '@/hooks/use-toast';
import { ChatResponseRenderer } from '@/components/chat/ChatResponseRenderer';
import { useChatFileUpload } from '@/hooks/useChatFileUpload';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/club-chat`;
const SUPER_ADMIN_EMAIL = 'suryakant.gnbba2029@iilm.edu';

const ChatbotPage = () => {
  const { user, session } = useAuth();
  const { activeClub } = useClub();
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  const activeClubId = isSuperAdmin ? undefined : activeClub?.club_id;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { file, uploading, inputRef, openPicker, handleFileSelect, clearFile, acceptedTypes } = useChatFileUpload();

  useEffect(() => {
    setMessages([]);
    setInput('');
    clearFile();
  }, [activeClubId]);

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
    setTimeout(() => {
      const sendBtn = document.querySelector('[data-chat-send]') as HTMLButtonElement;
      sendBtn?.click();
    }, 100);
  };

  const send = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !file) || loading) return;

    let userMsg = trimmed;
    let fileUrl: string | undefined;
    let fileName: string | undefined;

    if (file) {
      fileUrl = file.storageUrl;
      fileName = file.name;
      if (!userMsg) userMsg = `[Uploaded file: ${file.name}]`;
      clearFile();
    }

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const body: any = {
        message: userMsg,
        history: messages,
        ...(activeClubId && { clubId: activeClubId }),
        ...(fileUrl && { fileUrl, fileName }),
      };

      const res = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response.' }]);
    } catch {
      toast({ title: 'Chat error', description: 'Could not reach the chatbot.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex antialiased" style={{ backgroundColor: '#F4EFE7' }}>
      {!isMobile && <DashboardSidebar />}
      {isMobile && (
        <div className="fixed top-0 left-0 z-40" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center"
            style={{
              width: '36px',
              height: '36px',
              background: '#E98A3A',
              border: '2px solid #111',
              boxShadow: '2px 2px 0px #111',
              borderRadius: '0 8px 8px 0',
            }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: '#111' }} strokeWidth={3} />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto" style={{ padding: isMobile ? '60px 16px 24px' : '24px 28px' }}>
        <div className="flex flex-col h-full max-w-3xl mx-auto" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#E98A3A', border: '2px solid #111' }}
        >
          <Bot className="w-5 h-5" style={{ color: '#111' }} />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
            AI Chatbot
          </h1>
          <p className="text-xs" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
            {activeClub ? `Managing ${activeClub.club_name}` : 'Super Admin Mode'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.length === 0 && (
          <div
            className="text-center py-16"
            style={{
              background: '#FFFDF7',
              border: '3px solid #111',
              borderRadius: '14px',
              boxShadow: '4px 4px 0px #111',
            }}
          >
            <Bot className="w-12 h-12 mx-auto mb-3" style={{ color: '#E98A3A' }} />
            <p className="font-bold text-base" style={{ color: '#111', fontFamily: "'Space Grotesk', sans-serif" }}>
              How can I help you today?
            </p>
            <p className="text-sm mt-1" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
              Ask me about events, members, or club management.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{ background: '#E98A3A', border: '2px solid #111' }}
              >
                <Bot className="w-4 h-4" style={{ color: '#111' }} />
              </div>
            )}
            <div
              className="max-w-[75%] px-4 py-3"
              style={{
                background: msg.role === 'user' ? '#111' : '#FFFDF7',
                color: msg.role === 'user' ? '#fff' : '#111',
                border: '2px solid #111',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                boxShadow: '3px 3px 0px #111',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '14px',
              }}
            >
              {msg.role === 'assistant' ? (
                <ChatResponseRenderer content={msg.content} onFormSubmit={handleFormSubmit} />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{ background: '#F4EFE7', border: '2px solid #111' }}
              >
                <User className="w-4 h-4" style={{ color: '#111' }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#E98A3A', border: '2px solid #111' }}
            >
              <Bot className="w-4 h-4" style={{ color: '#111' }} />
            </div>
            <div
              className="px-4 py-3"
              style={{
                background: '#FFFDF7',
                border: '2px solid #111',
                borderRadius: '14px 14px 14px 4px',
                boxShadow: '3px 3px 0px #111',
              }}
            >
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E98A3A', animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E98A3A', animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#E98A3A', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File indicator */}
      {file && (
        <div
          className="flex items-center gap-2 px-3 py-2 mb-2"
          style={{
            background: '#FFF4D6',
            border: '2px solid #111',
            borderRadius: '10px',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          <FileText className="w-4 h-4" style={{ color: '#111' }} />
          <span className="text-xs font-bold truncate flex-1" style={{ color: '#111' }}>{file.name}</span>
          <button onClick={clearFile} className="text-xs font-bold px-2 py-0.5" style={{ background: '#111', color: '#fff', borderRadius: '6px' }}>✕</button>
        </div>
      )}

      {/* Input */}
      <div
        className="flex items-center gap-2 p-3"
        style={{
          background: '#FFFDF7',
          border: '3px solid #111',
          borderRadius: '14px',
          boxShadow: '4px 4px 0px #111',
        }}
      >
        <input ref={inputRef} type="file" accept={acceptedTypes} className="hidden" onChange={handleFileSelect} />
        <button
          onClick={openPicker}
          disabled={uploading}
          className="p-2 rounded-lg transition-all"
          style={{ border: '2px solid #111', background: '#F4EFE7' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#E98A3A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F4EFE7'; }}
        >
          <Paperclip className="w-4 h-4" style={{ color: '#111' }} />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type your message..."
          className="flex-1 bg-transparent outline-none text-sm font-medium"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
        />
        <button
          data-chat-send
          onClick={send}
          disabled={loading || (!input.trim() && !file)}
          className="p-2 rounded-lg transition-all disabled:opacity-40"
          style={{
            background: '#E98A3A',
            border: '2px solid #111',
            boxShadow: '2px 2px 0px #111',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #111'; }}
        >
          <Send className="w-4 h-4" style={{ color: '#111' }} />
        </button>
      </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
