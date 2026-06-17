import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [realtimeBuses, setRealtimeBuses] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Determine socket connection URL. Since client is hosted at port 5173 and proxied to 5000,
    // socket connection must go directly to backend port 5000 in dev.
    const socketUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://bus-tracking-server-s751.onrender.com');
    
    console.log(`Connecting to WebSocket server at: ${socketUrl}`);
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnected(true);
    });

    newSocket.on('connectionStatus', (data) => {
      console.log('Connection status from server:', data);
    });

    newSocket.on('busLocationUpdate', (busesData) => {
      setRealtimeBuses(busesData);
    });

    newSocket.on('systemLog', (log) => {
      setSystemLogs((prevLogs) => {
        const newLogs = [log, ...prevLogs];
        return newLogs.slice(0, 50); // Keep last 50 logs
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, realtimeBuses, systemLogs, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
