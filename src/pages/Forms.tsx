import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Forms() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#F4EFE7', fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 text-sm font-bold"
        style={{
          background: '#FFFDF5',
          color: '#111',
          border: '2px solid #111',
          borderRadius: '6px',
          boxShadow: '3px 3px 0px #111',
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 18, stiffness: 200 }}
        className="w-full max-w-md p-8 text-center"
        style={{
          background: '#FFFDF5',
          border: '3px solid #111',
          borderRadius: '12px',
          boxShadow: '8px 8px 0px #111',
        }}
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.5 }}
          className="w-20 h-20 mx-auto mb-5 flex items-center justify-center"
          style={{
            background: '#E98A3A',
            border: '3px solid #111',
            borderRadius: '14px',
            boxShadow: '4px 4px 0px #111',
          }}
        >
          <FileText className="w-10 h-10" style={{ color: '#111' }} />
        </motion.div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 mb-4"
          style={{
            background: '#FDE8D0',
            border: '2px solid #111',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#111',
          }}
        >
          <Sparkles className="w-3 h-3" />
          New Feature
        </div>

        <h1
          className="text-4xl font-black mb-3"
          style={{ color: '#111', letterSpacing: '-0.02em' }}
        >
          Forms — Coming Soon
        </h1>

        <p
          className="text-sm leading-relaxed"
          style={{ color: '#555', fontWeight: 500 }}
        >
          We're building a powerful Forms feature so clubs can create surveys,
          registrations, and feedback forms — right inside Club Flow.
          Stay tuned, this drops soon!
        </p>

        <div
          className="mt-6 pt-5 text-xs font-bold uppercase tracking-wider"
          style={{
            color: '#888',
            borderTop: '2px dashed #ddd',
          }}
        >
          🛠️ Under Construction
        </div>
      </motion.div>
    </div>
  );
}
