import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useWebSocket } from '../../hooks/useWebSocket';
import { extractVideoId } from '../../lib/api';
import type { Participant, ChatMessage, Role } from '../../lib/types';
import ParticipantsList from '../../components/ParticipantsList';
import ChatPanel from '../../components/ChatPanel';
import VideoControls from '../../components/VideoControls';

// Dynamically import YouTube player to avoid SSR issues
const YouTube = dynamic(() => import('react-youtube'), { ssr: false });

export default function RoomPage() {
  const router = useRouter();
  const { roomId } = router.query as { roomId: string };

  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('participant');
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newVideoInput, setNewVideoInput] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [sidePanel, setSidePanel] = useState<'participants' | 'chat'>('chat');
  const [notification, setNotification] = useState('');

  const playerRef = useRef<any>(null);
  const isSyncingRef = useRef(false);
  const lastSeekRef = useRef(0);

  useEffect(() => {
    if (!router.isReady) return;
    const uid = sessionStorage.getItem('wp_userId');
    const uname = sessionStorage.getItem('wp_username');
    const urole = sessionStorage.getItem('wp_role') as Role;
    if (!uid || !uname) {
      router.replace('/');
      return;
    }
    setUserId(uid);
    setUsername(uname);
    setRole(urole || 'participant');
  }, [router.isReady]);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'sync_state':
        setParticipants(msg.participants || []);
        setVideoId(msg.videoId);
        setIsPlaying(msg.playState === 'playing');
        if (playerRef.current) {
          isSyncingRef.current = true;
          playerRef.current.seekTo(msg.currentTime, true);
          if (msg.playState === 'playing') {
            playerRef.current.playVideo();
          } else {
            playerRef.current.pauseVideo();
          }
          setTimeout(() => { isSyncingRef.current = false; }, 500);
        }
        break;

      case 'play':
        setIsPlaying(true);
        if (playerRef.current) {
          isSyncingRef.current = true;
          if (msg.currentTime !== undefined) playerRef.current.seekTo(msg.currentTime, true);
          playerRef.current.playVideo();
          setTimeout(() => { isSyncingRef.current = false; }, 500);
        }
        break;

      case 'pause':
        setIsPlaying(false);
        if (playerRef.current) {
          isSyncingRef.current = true;
          if (msg.currentTime !== undefined) playerRef.current.seekTo(msg.currentTime, true);
          playerRef.current.pauseVideo();
          setTimeout(() => { isSyncingRef.current = false; }, 500);
        }
        break;

      case 'seek':
        if (playerRef.current) {
          isSyncingRef.current = true;
          playerRef.current.seekTo(msg.time, true);
          setTimeout(() => { isSyncingRef.current = false; }, 500);
        }
        break;

      case 'change_video':
        setVideoId(msg.videoId);
        setIsPlaying(false);
        break;

      case 'user_joined':
        setParticipants(msg.participants || []);
        showNotif(`${msg.username} joined the party`);
        break;

      case 'user_left':
        setParticipants(msg.participants || []);
        showNotif(`${msg.username} left the party`);
        break;

      case 'role_assigned':
        setParticipants(msg.participants || []);
        // Update own role if it changed
        if (msg.userId === userId) {
          setRole(msg.role);
          sessionStorage.setItem('wp_role', msg.role);
          showNotif(`Your role changed to ${msg.role}`);
        } else {
          showNotif(`${msg.username} is now ${msg.role}`);
        }
        break;

      case 'participant_removed':
        setParticipants(msg.participants || []);
        break;

      case 'removed':
        showNotif('You were removed from the room');
        setTimeout(() => router.replace('/'), 2000);
        break;

      case 'chat':
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          userId: msg.userId,
          username: msg.username,
          message: msg.message,
          timestamp: Date.now(),
        }]);
        break;

      case 'error':
        showNotif(`⚠ ${msg.message}`);
        break;
    }
  }, [userId]);

  const { send, connected } = useWebSocket(
    roomId || null,
    userId || null,
    handleMessage
  );

  const canControl = role === 'host' || role === 'moderator';

  const handlePlay = useCallback(() => {
    if (!canControl || isSyncingRef.current) return;
    const time = playerRef.current?.getCurrentTime() || 0;
    send({ type: 'play', currentTime: time });
  }, [canControl, send]);

  const handlePause = useCallback(() => {
    if (!canControl || isSyncingRef.current) return;
    const time = playerRef.current?.getCurrentTime() || 0;
    send({ type: 'pause', currentTime: time });
  }, [canControl, send]);

  const handleSeek = useCallback(() => {
    if (!canControl || isSyncingRef.current) return;
    const time = playerRef.current?.getCurrentTime() || 0;
    const now = Date.now();
    if (now - lastSeekRef.current < 500) return;
    lastSeekRef.current = now;
    send({ type: 'seek', time });
  }, [canControl, send]);

  const handleChangeVideo = () => {
    if (!canControl || !newVideoInput.trim()) return;
    const vid = extractVideoId(newVideoInput.trim());
    send({ type: 'change_video', videoId: vid });
    setNewVideoInput('');
    setShowVideoInput(false);
  };

  const handleSendChat = (message: string) => {
    if (!message.trim()) return;
    send({ type: 'chat', message });
  };

  const handleAssignRole = (targetUserId: string, newRole: Role) => {
    send({ type: 'assign_role', userId: targetUserId, role: newRole });
  };

  const handleRemoveParticipant = (targetUserId: string) => {
    send({ type: 'remove_participant', userId: targetUserId });
  };

  const handleTransferHost = (targetUserId: string) => {
    send({ type: 'transfer_host', userId: targetUserId });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onPlayerReady = (e: any) => {
    playerRef.current = e.target;
  };

  if (!userId) return null;

  return (
    <>
      <Head>
        <title>WatchParty — Room {roomId}</title>
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-cinema-border px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="font-display font-bold text-lg text-white hover:text-cinema-accent transition-colors"
            >
              Watch<span className="text-cinema-accent">Party</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 cinema-card px-3 py-1.5">
              <span className="font-mono text-xs text-cinema-dim">ROOM</span>
              <span className="font-mono text-sm text-cinema-gold tracking-widest">{roomId}</span>
              <button
                onClick={copyRoomCode}
                className="font-mono text-xs text-cinema-accent hover:text-white transition-colors ml-1"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`live-dot ${connected ? '' : 'bg-cinema-dim'}`} />
              <span className="font-mono text-xs text-cinema-dim hidden sm:block">
                {connected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`role-badge role-${role}`}>{role}</span>
              <span className="font-body text-sm text-cinema-silver">{username}</span>
            </div>
          </div>
        </header>

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 cinema-card border-cinema-accent px-4 py-2 animate-slide-up">
            <p className="font-mono text-xs text-cinema-silver">{notification}</p>
          </div>
        )}

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Player + Controls */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Player */}
            <div className="player-wrapper">
              <YouTube
                videoId={videoId}
                onReady={onPlayerReady}
                onPlay={handlePlay}
                onPause={handlePause}
                onStateChange={(e: any) => {
                  // 2 = paused by seeking
                  if (e.data === 2 && !isSyncingRef.current) handlePause();
                }}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 0,
                    controls: canControl ? 1 : 0,
                    rel: 0,
                    modestbranding: 1,
                  },
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Controls bar */}
            <div className="cinema-card border-t border-cinema-border px-4 py-3">
              <VideoControls
                canControl={canControl}
                isPlaying={isPlaying}
                showVideoInput={showVideoInput}
                newVideoInput={newVideoInput}
                onTogglePlay={() => {
                  if (!canControl) return;
                  if (isPlaying) {
                    const t = playerRef.current?.getCurrentTime() || 0;
                    send({ type: 'pause', currentTime: t });
                    playerRef.current?.pauseVideo();
                  } else {
                    const t = playerRef.current?.getCurrentTime() || 0;
                    send({ type: 'play', currentTime: t });
                    playerRef.current?.playVideo();
                  }
                }}
                onToggleVideoInput={() => setShowVideoInput(!showVideoInput)}
                onVideoInputChange={setNewVideoInput}
                onChangeVideo={handleChangeVideo}
                roomId={roomId}
                onCopy={copyRoomCode}
                copied={copied}
                participantCount={participants.length}
              />
            </div>

            {/* Mobile tab switcher */}
            <div className="sm:hidden flex border-t border-cinema-border">
              {(['chat', 'participants'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSidePanel(p)}
                  className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                    sidePanel === p ? 'text-cinema-accent border-b-2 border-cinema-accent' : 'text-cinema-dim'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-72 hidden sm:flex flex-col border-l border-cinema-border">
            {/* Sidebar tabs */}
            <div className="flex border-b border-cinema-border flex-shrink-0">
              {(['chat', 'participants'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSidePanel(p)}
                  className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors ${
                    sidePanel === p ? 'text-cinema-accent border-b-2 border-cinema-accent -mb-px' : 'text-cinema-dim hover:text-cinema-silver'
                  }`}
                >
                  {p === 'chat' ? `Chat` : `Viewers (${participants.length})`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {sidePanel === 'chat' ? (
                <ChatPanel
                  messages={chatMessages}
                  userId={userId}
                  username={username}
                  onSend={handleSendChat}
                />
              ) : (
                <ParticipantsList
                  participants={participants}
                  currentUserId={userId}
                  currentRole={role}
                  onAssignRole={handleAssignRole}
                  onRemove={handleRemoveParticipant}
                  onTransferHost={handleTransferHost}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile panel */}
        <div className="sm:hidden border-t border-cinema-border" style={{ height: '240px' }}>
          {sidePanel === 'chat' ? (
            <ChatPanel
              messages={chatMessages}
              userId={userId}
              username={username}
              onSend={handleSendChat}
            />
          ) : (
            <ParticipantsList
              participants={participants}
              currentUserId={userId}
              currentRole={role}
              onAssignRole={handleAssignRole}
              onRemove={handleRemoveParticipant}
              onTransferHost={handleTransferHost}
            />
          )}
        </div>
      </div>
    </>
  );
}
