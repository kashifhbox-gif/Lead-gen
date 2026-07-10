import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, Sparkles, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function Home() {
  const [profileUrl, setProfileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUrl) return;
    
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileUrl }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage('Job started successfully! The AI is scraping and analyzing the profile in the background.');
        setProfileUrl('');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage('An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 pt-20">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20"
          >
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
            AI Lead Generator
          </h1>
          <p className="text-lg text-neutral-400 font-light">
            Enter a LinkedIn profile. We'll scrape their recent posts and let Gemini qualify them based on B2B SaaS buying signals.
          </p>
        </div>

        <motion.div 
          className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-2 md:p-4 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          whileHover={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          
          <form onSubmit={handleGenerate} className="relative flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="url"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full bg-black/20 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !profileUrl}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-medium py-4 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Generate <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl border flex items-start gap-3 \${
              message.includes('Error') 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {message.includes('Error') ? (
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <p className="text-sm leading-relaxed">{message}</p>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
