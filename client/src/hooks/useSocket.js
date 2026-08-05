import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config.js';
import { useAuthStore } from '../stores/authStore.js';
import { useCollaborationStore } from '../stores/collaborationStore.js';

export function useSocket() {
  const token = useAuthStore((s) => s.accessToken);
  const socket = useCollaborationStore((s) => s.socket);
  const setSocket = useCollaborationStore((s) => s.setSocket);
  const setConnected = useCollaborationStore((s) => s.setConnected);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!token || connectedRef.current) return;
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    setSocket(s);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => {
      // auth failures handled by store
    });
    connectedRef.current = true;
    return () => {
      connectedRef.current = false;
      s.disconnect();
      setSocket(null);
    };
  }, [token, setSocket, setConnected]);

  return socket;
}
