interface VideoControlsProps {
  canControl: boolean;
  isPlaying: boolean;
  showVideoInput: boolean;
  newVideoInput: string;
  onTogglePlay: () => void;
  onToggleVideoInput: () => void;
  onVideoInputChange: (val: string) => void;
  onChangeVideo: () => void;
  roomId: string;
  onCopy: () => void;
  copied: boolean;
  participantCount: number;
}

export default function VideoControls({
  canControl,
  isPlaying,
  showVideoInput,
  newVideoInput,
  onTogglePlay,
  onToggleVideoInput,
  onVideoInputChange,
  onChangeVideo,
  roomId,
  onCopy,
  copied,
  participantCount,
}: VideoControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {canControl && (
            <button
              onClick={onTogglePlay}
              className="cinema-btn cinema-btn-primary px-4 py-2 flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <rect x="1" y="0" width="4" height="12" rx="1"/>
                    <rect x="7" y="0" width="4" height="12" rx="1"/>
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <polygon points="0,0 12,6 0,12"/>
                  </svg>
                  Play
                </>
              )}
            </button>
          )}

          {canControl && (
            <button
              onClick={onToggleVideoInput}
              className="cinema-btn cinema-btn-secondary px-3 py-2"
            >
              {showVideoInput ? 'Cancel' : '+ Change Video'}
            </button>
          )}

          {!canControl && (
            <span className="font-mono text-xs text-cinema-dim">
              Only host/moderator can control playback
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cinema-dim">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5.5 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM1.5 14.5A1.5 1.5 0 0 1 0 13c0-1 1-4 4.5-4 .5 0 1 .05 1.5.14A5.044 5.044 0 0 0 4.5 11c-.5 1-.5 2-.5 2H1.5Z"/>
            </svg>
            <span className="font-mono text-xs">{participantCount}</span>
          </div>

          <button
            onClick={onCopy}
            className="cinema-btn cinema-btn-ghost px-2 py-1 font-mono text-xs flex items-center gap-1.5"
          >
            <span className="text-cinema-gold">{roomId}</span>
            <span>{copied ? '✓' : '⎘'}</span>
          </button>
        </div>
      </div>

      {showVideoInput && canControl && (
        <div className="flex gap-2 animate-slide-up">
          <input
            className="cinema-input flex-1 px-3 py-2 text-sm"
            placeholder="YouTube URL or video ID"
            value={newVideoInput}
            onChange={e => onVideoInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onChangeVideo()}
            autoFocus
          />
          <button
            onClick={onChangeVideo}
            disabled={!newVideoInput.trim()}
            className="cinema-btn cinema-btn-primary px-4 py-2 disabled:opacity-40"
          >
            Load
          </button>
        </div>
      )}
    </div>
  );
}
