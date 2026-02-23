'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { Notification, Booking } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface WebSocketContextValue {
  /** Whether the WebSocket is currently connected */
  isConnected: boolean;

  /**
   * Subscribe to new notifications
   * @returns Unsubscribe function
   */
  onNotification: (handler: (notification: Notification) => void) => () => void;

  /**
   * Subscribe to notification count updates
   * @returns Unsubscribe function
   */
  onNotificationCount: (handler: (count: number) => void) => () => void;

  /**
   * Subscribe to booking status updates
   * @returns Unsubscribe function
   */
  onBookingStatus: (handler: (booking: Booking) => void) => () => void;
}

// ============================================================================
// Context
// ============================================================================

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Handler registries
  const notificationHandlers = useRef<Set<(n: Notification) => void>>(new Set());
  const countHandlers = useRef<Set<(c: number) => void>>(new Set());
  const bookingStatusHandlers = useRef<Set<(b: Booking) => void>>(new Set());

  // ============================================================================
  // Socket Connection Management
  // ============================================================================

  useEffect(() => {
    // Disconnect if user logs out
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Don't create a new connection if one exists and is connected
    if (socketRef.current?.connected) {
      return;
    }

    // Create socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('[WebSocket] Connected to', SOCKET_URL);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.log('[WebSocket] Connection error:', error.message);
      setIsConnected(false);
    });

    // ========================================================================
    // Event Handlers
    // ========================================================================

    // Notification events
    socket.on('notification', (notification: Notification) => {
      notificationHandlers.current.forEach((handler) => handler(notification));
    });

    socket.on('notification:count', (data: { count: number }) => {
      countHandlers.current.forEach((handler) => handler(data.count));
    });

    // Booking status events
    socket.on('booking:status', (booking: Booking) => {
      console.log('[WebSocket] Received booking status update:', booking.id, booking.status);
      bookingStatusHandlers.current.forEach((handler) => handler(booking));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [user, token]);

  // ============================================================================
  // Subscription Methods
  // ============================================================================

  const onNotification = useCallback(
    (handler: (notification: Notification) => void) => {
      notificationHandlers.current.add(handler);
      return () => {
        notificationHandlers.current.delete(handler);
      };
    },
    []
  );

  const onNotificationCount = useCallback((handler: (count: number) => void) => {
    countHandlers.current.add(handler);
    return () => {
      countHandlers.current.delete(handler);
    };
  }, []);

  const onBookingStatus = useCallback(
    (handler: (booking: Booking) => void) => {
      bookingStatusHandlers.current.add(handler);
      return () => {
        bookingStatusHandlers.current.delete(handler);
      };
    },
    []
  );

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: WebSocketContextValue = {
    isConnected,
    onNotification,
    onNotificationCount,
    onBookingStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
}
