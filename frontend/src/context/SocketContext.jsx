import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to backend server (assuming default port 5000 for dev)
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to real-time server');
    });

    // Listen for global notifications
    newSocket.on('new_order', (data) => {
      toast.success(
        <div>
          <p className="font-bold">{data.title}</p>
          <p className="text-sm">{data.message}</p>
        </div>, 
        { duration: 6000, icon: '🛍️' }
      );
    });

    setSocket(newSocket);

    return () => newSocket.close();
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
