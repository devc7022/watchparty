import { useEffect, useRef, useCallback, useState } from 'react';

export type WSMessage = {
  type: string;
  [key: string]: any;
};

export function useWebSocket(
  roomId: string | null,
  userId: string | null,
  onMessage: (msg: WSMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!roomId || !userId) return;

    const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsBase}/ws/${roomId}/${userId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onMessageRef.current(data);
      } catch {}
    };
    ws.onerror = (e) => console.error('WS error', e);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId, userId]);

  const send = useCallback((data: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send, connected };
}
