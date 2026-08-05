import { create } from 'zustand';

export const useCollaborationStore = create((set, get) => ({
  socket: null,
  connected: false,
  isHost: false,
  roomId: null,
  presence: [],
  cursors: {},
  chatMessages: [],
  comments: [],
  reactions: [],
  onlineCount: 0,
  users: [],

  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ connected }),
  setRoomId: (roomId) => set({ roomId }),
  setIsHost: (isHost) => set({ isHost }),
  setPresence: (presence) => set({ presence }),
  setUsers: (users) => set({ users, onlineCount: users.length }),

  setCursor: (socketId, cursor) =>
    set((s) => ({ cursors: { ...s.cursors, [socketId]: cursor } })),
  removeCursor: (socketId) =>
    set((s) => {
      const { [socketId]: _removed, ...rest } = s.cursors;
      return { cursors: rest };
    }),

  addChatMessage: (message) =>
    set((s) => ({ chatMessages: [...s.chatMessages, message].slice(-200) })),
  clearChat: () => set({ chatMessages: [] }),

  addReaction: (reaction) =>
    set((s) => ({ reactions: [...s.reactions, reaction].slice(-30) })),
  clearReactions: () => set({ reactions: [] }),

  reset: () =>
    set({
      socket: null,
      connected: false,
      roomId: null,
      presence: [],
      cursors: {},
      chatMessages: [],
      comments: [],
      reactions: [],
      onlineCount: 0,
      users: [],
    }),
}));
