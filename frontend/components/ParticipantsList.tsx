import { useState } from 'react';
import type { Participant, Role } from '../lib/types';

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId: string;
  currentRole: Role;
  onAssignRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
  onTransferHost: (userId: string) => void;
}

export default function ParticipantsList({
  participants,
  currentUserId,
  currentRole,
  onAssignRole,
  onRemove,
  onTransferHost,
}: ParticipantsListProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const isHost = currentRole === 'host';

  const roleOrder: Role[] = ['host', 'moderator', 'participant'];
  const sorted = [...participants].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 space-y-1">
      {sorted.map(p => (
        <div
          key={p.userId}
          className={`flex items-center justify-between px-3 py-2.5 rounded-sm transition-colors ${
            p.userId === currentUserId ? 'bg-cinema-card' : 'hover:bg-cinema-card'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-cinema-border flex items-center justify-center flex-shrink-0 text-xs font-mono">
              {p.username[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-body text-sm text-cinema-silver truncate">
                  {p.username}
                </span>
                {p.userId === currentUserId && (
                  <span className="font-mono text-xs text-cinema-dim">(you)</span>
                )}
              </div>
              <span className={`role-badge role-${p.role}`}>{p.role}</span>
            </div>
          </div>

          {/* Host actions */}
          {isHost && p.userId !== currentUserId && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(menuOpen === p.userId ? null : p.userId)}
                className="cinema-btn cinema-btn-ghost p-1 text-cinema-dim hover:text-cinema-silver"
              >
                ···
              </button>

              {menuOpen === p.userId && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 cinema-card border-cinema-border z-10 py-1"
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                >
                  {p.role !== 'moderator' && (
                    <button
                      onClick={() => { onAssignRole(p.userId, 'moderator'); setMenuOpen(null); }}
                      className="w-full text-left px-3 py-2 font-mono text-xs text-cinema-silver hover:bg-cinema-border hover:text-white transition-colors"
                    >
                      → Make Moderator
                    </button>
                  )}
                  {p.role !== 'participant' && (
                    <button
                      onClick={() => { onAssignRole(p.userId, 'participant'); setMenuOpen(null); }}
                      className="w-full text-left px-3 py-2 font-mono text-xs text-cinema-silver hover:bg-cinema-border hover:text-white transition-colors"
                    >
                      → Make Participant
                    </button>
                  )}
                  <button
                    onClick={() => { onTransferHost(p.userId); setMenuOpen(null); }}
                    className="w-full text-left px-3 py-2 font-mono text-xs text-cinema-gold hover:bg-cinema-border transition-colors"
                  >
                    ★ Transfer Host
                  </button>
                  <hr className="cinema-divider my-1" />
                  <button
                    onClick={() => { onRemove(p.userId); setMenuOpen(null); }}
                    className="w-full text-left px-3 py-2 font-mono text-xs text-cinema-accent hover:bg-cinema-border transition-colors"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {participants.length === 0 && (
        <div className="text-center text-cinema-dim text-xs font-mono mt-8">
          No participants yet
        </div>
      )}

      {/* Click outside to close */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  );
}
