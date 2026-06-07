/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

// Singleton socket instance — prevents duplicate connections across hot-reloads and StrictMode double-mount
let socketSingleton = null;

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!socketSingleton) {
      socketSingleton = io(import.meta.env.VITE_API_URL, {
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      socketSingleton.on('connect', () => {
        if (import.meta.env.DEV) console.log('[Socket] Connected to real-time server');
      });

      socketSingleton.on('disconnect', (reason) => {
        if (import.meta.env.DEV) console.log('[Socket] Disconnected:', reason);
      });

      socketSingleton.on('new_order', (data) => {
        toast.success(
          <div>
            <p className="font-bold">{data.title}</p>
            <p className="text-sm">{data.message}</p>
          </div>,
          { duration: 6000, icon: '🛍️' }
        );
      });

      socketSingleton.on('new_notification', (data) => {
        toast(data.notification.message, {
          icon: '🔔',
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
      });
    }

    setSocket(socketSingleton);
    // Do NOT close singleton on unmount — it's shared across the app lifecycle
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
