import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../lib/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  userId: string;
  username: string;
  onSend: (msg: string) => void;
}

export default function ChatPanel({ messages, userId, username, onSend }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-cinema-dim text-xs font-mono mt-8">
            <p>No messages yet.</p>
            <p className="mt-1">Say hello! 👋</p>
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`chat-message ${msg.userId === userId ? 'text-right' : ''}`}
          >
            {msg.userId !== userId && (
              <span className="font-mono text-xs text-cinema-accent block mb-0.5">
                {msg.username}
              </span>
            )}
            <span
              className={`inline-block px-2.5 py-1.5 text-xs rounded-sm max-w-xs break-words ${
                msg.userId === userId
                  ? 'bg-cinema-accent text-white'
                  : 'bg-cinema-card text-cinema-silver border border-cinema-border'
              }`}
            >
              {msg.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-cinema-border p-2 flex gap-2 flex-shrink-0">
        <input
          className="cinema-input flex-1 px-2.5 py-2 text-xs"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          maxLength={300}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="cinema-btn cinema-btn-primary px-3 py-2 disabled:opacity-40"
        >
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
