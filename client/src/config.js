export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
export const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.origin.replace('http', 'ws')}/ws/collab`;
