/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();           // read from React state — tab-isolated ✅
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Tear down any previous socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }

    // Don't open a socket if this tab has no authenticated user
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL, {
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      // Pass the token so the server knows WHO this socket belongs to ✅
      auth: { token },
    });

    newSocket.on('connect', () => {
      if (import.meta.env.DEV) console.log('[Socket] Connected — user:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      if (import.meta.env.DEV) console.warn('[Socket] Connection error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) console.log('[Socket] Disconnected:', reason);
    });

    newSocket.on('new_order', (data) => {
      toast.success(
        <div>
          <p className="font-bold">{data.title}</p>
          <p className="text-sm">{data.message}</p>
        </div>,
        { duration: 6000, icon: '🛍️' }
      );
    });

    newSocket.on('new_notification', (data) => {
      toast(data.notification?.message || data.message, {
        icon: '🔔',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup: disconnect when token changes (user switches account or logs out)
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token]); // re-runs whenever the active user changes in this tab ✅

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
