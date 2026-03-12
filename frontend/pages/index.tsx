import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createRoom, joinRoom, extractVideoId } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [username, setUsername] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!username.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');
    try {
      const videoId = videoUrl ? extractVideoId(videoUrl) : 'dQw4w9WgXcQ';
      const data = await createRoom(username.trim(), videoId);
      sessionStorage.setItem('wp_userId', data.userId);
      sessionStorage.setItem('wp_username', data.username);
      sessionStorage.setItem('wp_role', data.role);
      router.push(`/room/${data.roomId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!username.trim()) return setError('Enter your name');
    if (!roomCode.trim()) return setError('Enter room code');
    setLoading(true);
    setError('');
    try {
      const data = await joinRoom(roomCode.trim().toUpperCase(), username.trim());
      sessionStorage.setItem('wp_userId', data.userId);
      sessionStorage.setItem('wp_username', data.username);
      sessionStorage.setItem('wp_role', data.role);
      router.push(`/room/${data.roomId}`);
    } catch (e: any) {
      setError(e.message || 'Room not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>WatchParty — Watch Together</title>
        <meta name="description" content="Watch YouTube videos together in perfect sync" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-cinema-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 filmstrip">
              {[...Array(5)].map((_, i) => <div key={i} className="filmstrip-hole" />)}
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight">
              Watch<span className="text-cinema-accent">Party</span>
            </h1>
            <div className="flex gap-1 filmstrip">
              {[...Array(5)].map((_, i) => <div key={i} className="filmstrip-hole" />)}
            </div>
          </div>
          <span className="font-mono text-xs text-cinema-dim">SYNC · SHARE · WATCH</span>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="live-dot" />
              <span className="font-mono text-xs text-cinema-accent tracking-widest uppercase">Live Watch Sessions</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-black mb-4 leading-none">
              Watch Together,<br/>
              <span className="text-cinema-accent text-glow-gold">In Sync.</span>
            </h2>
            <p className="text-cinema-dim font-body text-lg max-w-md mx-auto">
              Create a room, share the code, and experience YouTube videos frame-perfect with friends.
            </p>
          </div>

          {/* Card */}
          <div className="w-full max-w-md cinema-card p-6 animate-slide-up">
            {/* Tabs */}
            <div className="flex mb-6 border-b border-cinema-border">
              {(['create', 'join'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 pb-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                    tab === t
                      ? 'text-cinema-accent border-b-2 border-cinema-accent -mb-px'
                      : 'text-cinema-dim hover:text-cinema-silver'
                  }`}
                >
                  {t === 'create' ? '+ Create Room' : '→ Join Room'}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div>
                <label className="block font-mono text-xs text-cinema-dim uppercase tracking-widest mb-1.5">
                  Your Name
                </label>
                <input
                  className="cinema-input w-full px-3 py-2.5 text-sm"
                  placeholder="e.g. Raj, Priya..."
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
                />
              </div>

              {tab === 'create' && (
                <div>
                  <label className="block font-mono text-xs text-cinema-dim uppercase tracking-widest mb-1.5">
                    YouTube URL or Video ID <span className="text-cinema-dim normal-case">(optional)</span>
                  </label>
                  <input
                    className="cinema-input w-full px-3 py-2.5 text-sm"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                  />
                </div>
              )}

              {tab === 'join' && (
                <div>
                  <label className="block font-mono text-xs text-cinema-dim uppercase tracking-widest mb-1.5">
                    Room Code
                  </label>
                  <input
                    className="cinema-input w-full px-3 py-2.5 text-sm font-mono uppercase tracking-widest"
                    placeholder="XXXXXXXX"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    maxLength={8}
                  />
                </div>
              )}

              {error && (
                <p className="text-cinema-accent text-xs font-mono highlight-bar pl-3">{error}</p>
              )}

              <button
                onClick={tab === 'create' ? handleCreate : handleJoin}
                disabled={loading}
                className="cinema-btn cinema-btn-primary w-full py-3 mt-2 disabled:opacity-50"
              >
                {loading ? 'Loading...' : tab === 'create' ? 'Create Watch Party' : 'Join Watch Party'}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg text-center animate-fade-in">
            {[
              { icon: '⚡', label: 'Real-time Sync', desc: 'WebSocket powered' },
              { icon: '🎭', label: 'Role Control', desc: 'Host · Mod · Viewer' },
              { icon: '💬', label: 'Live Chat', desc: 'React together' },
            ].map(f => (
              <div key={f.label} className="space-y-1">
                <div className="text-2xl">{f.icon}</div>
                <div className="font-mono text-xs text-cinema-silver uppercase tracking-wide">{f.label}</div>
                <div className="text-xs text-cinema-dim">{f.desc}</div>
              </div>
            ))}
          </div>
        </main>

        <footer className="border-t border-cinema-border px-6 py-4 text-center">
          <p className="font-mono text-xs text-cinema-dim">
            Built with Next.js · FastAPI · WebSockets
          </p>
        </footer>
      </div>
    </>
  );
}
