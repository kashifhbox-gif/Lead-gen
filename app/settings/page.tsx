'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, BrainCircuit, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'prompt' | 'keys'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [apifyKey, setApifyKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setPrompt(data.aiPrompt || '');
          setApifyKey(data.apifyApiKey || '');
          setGeminiKey(data.geminiApiKey || '');
          setGeminiModel(data.geminiModel || 'gemini-2.5-flash');
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: any = {};
      if (activeTab === 'prompt') {
        payload.aiPrompt = prompt;
      } else {
        payload.apifyApiKey = apifyKey;
        payload.geminiApiKey = geminiKey;
        payload.geminiModel = geminiModel || 'gemini-2.5-flash';
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-neutral-400">Manage your system configurations.</p>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-6">
        <button
          onClick={() => { setActiveTab('prompt'); setMessage(null); }}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'prompt' ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-300'}`}
        >
          AI Evaluation Prompt
        </button>
        <button
          onClick={() => { setActiveTab('keys'); setMessage(null); }}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'keys' ? 'border-indigo-500 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-300'}`}
        >
          API Keys
        </button>
      </div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden"
      >
        {activeTab === 'prompt' ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">AI Evaluation Prompt</h2>
                <p className="text-sm text-neutral-400">This prompt is used to score every scraped LinkedIn post.</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 border border-indigo-500/10 mb-6">
              <p className="text-sm text-indigo-300/80 leading-relaxed">
                <strong>Note:</strong> You do not need to instruct Gemini to return JSON. The system handles that automatically in the background. Just focus on what makes a lead qualified for your specific business.
              </p>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-64 bg-neutral-900 border border-white/10 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none mb-4"
              placeholder="Enter your AI evaluation instructions here..."
            />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">API Credentials</h2>
                <p className="text-sm text-neutral-400">Manage keys for Apify (LinkedIn Scraping) and Gemini (AI Evaluation).</p>
              </div>
            </div>

            <div className="space-y-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Apify API Token</label>
                <input
                  type="password"
                  value={apifyKey}
                  onChange={(e) => setApifyKey(e.target.value)}
                  placeholder="apify_api_..."
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
                <p className="text-xs text-neutral-500 mt-1">Used to trigger the LinkedIn scraper actor.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
                <p className="text-xs text-neutral-500 mt-1">Used to evaluate leads and generate outreach hooks.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Gemini Model</label>
                <input
                  type="text"
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  placeholder="gemini-3.1-flash-lite"
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
                <p className="text-xs text-neutral-500 mt-1">Specify which AI model to use for evaluations (e.g. gemini-3.1-flash-lite, gemini-2.5-flash).</p>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            {message && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
