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
import { Notification, BookingComment, Booking } from '@/types';

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
   * Subscribe to booking comments for a specific booking
   * Only comments for the specified bookingId will trigger the handler
   * @returns Unsubscribe function
   */
  onBookingComment: (
    bookingId: string,
    handler: (comment: BookingComment) => void
  ) => () => void;

  /**
   * Subscribe to booking status updates
   * @returns Unsubscribe function
   */
  onBookingStatus: (handler: (booking: Booking) => void) => () => void;

  /**
   * Join a booking room to receive real-time comments
   * Call this when opening a booking detail view
   */
  joinBookingRoom: (bookingId: string) => void;

  /**
   * Leave a booking room when done viewing
   * Call this when closing a booking detail view
   */
  leaveBookingRoom: (bookingId: string) => void;
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

  // Handler registries - using Map for booking comments to filter by bookingId
  const notificationHandlers = useRef<Set<(n: Notification) => void>>(new Set());
  const countHandlers = useRef<Set<(c: number) => void>>(new Set());
  const commentHandlers = useRef<Map<string, Set<(c: BookingComment) => void>>>(
    new Map()
  );
  const bookingStatusHandlers = useRef<Set<(b: Booking) => void>>(new Set());

  // Track which rooms we've joined to avoid duplicate joins
  const joinedRooms = useRef<Set<string>>(new Set());

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
        joinedRooms.current.clear();
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

      // Rejoin all rooms after reconnection
      joinedRooms.current.forEach((roomId) => {
        console.log('[WebSocket] Rejoining room:', roomId);
        socket.emit('booking:join', roomId);
      });
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

    // Booking comment events - dispatch to the correct booking's handlers
    socket.on('booking:comment', (comment: BookingComment) => {
      console.log('[WebSocket] Received comment for booking:', comment.bookingId, comment);
      const handlers = commentHandlers.current.get(comment.bookingId);
      console.log('[WebSocket] Handlers for this booking:', handlers?.size || 0);
      if (handlers) {
        handlers.forEach((handler) => handler(comment));
      }
    });

    // Booking status events - dispatch to all handlers
    socket.on('booking:status', (booking: Booking) => {
      console.log('[WebSocket] Received booking status update:', booking.id, booking.status);
      bookingStatusHandlers.current.forEach((handler) => handler(booking));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      joinedRooms.current.clear();
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

  const onBookingComment = useCallback(
    (bookingId: string, handler: (comment: BookingComment) => void) => {
      // Get or create handler set for this booking
      if (!commentHandlers.current.has(bookingId)) {
        commentHandlers.current.set(bookingId, new Set());
      }
      commentHandlers.current.get(bookingId)!.add(handler);

      return () => {
        const handlers = commentHandlers.current.get(bookingId);
        if (handlers) {
          handlers.delete(handler);
          // Clean up empty sets
          if (handlers.size === 0) {
            commentHandlers.current.delete(bookingId);
          }
        }
      };
    },
    []
  );

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
  // Room Management
  // ============================================================================

  const joinBookingRoom = useCallback((bookingId: string) => {
    console.log('[WebSocket] joinBookingRoom called:', bookingId, 'connected:', socketRef.current?.connected);
    if (socketRef.current?.connected && !joinedRooms.current.has(bookingId)) {
      socketRef.current.emit('booking:join', bookingId);
      joinedRooms.current.add(bookingId);
      console.log('[WebSocket] Joined room:', bookingId);
    }
  }, []);

  const leaveBookingRoom = useCallback((bookingId: string) => {
    if (socketRef.current?.connected && joinedRooms.current.has(bookingId)) {
      socketRef.current.emit('booking:leave', bookingId);
      joinedRooms.current.delete(bookingId);
    }
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: WebSocketContextValue = {
    isConnected,
    onNotification,
    onNotificationCount,
    onBookingComment,
    onBookingStatus,
    joinBookingRoom,
    leaveBookingRoom,
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

/**
 * Hook to access WebSocket functionality
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, onNotification } = useWebSocket();
 *
 *   useEffect(() => {
 *     const unsubscribe = onNotification((notification) => {
 *       console.log('New notification:', notification);
 *     });
 *     return unsubscribe;
 *   }, [onNotification]);
 * }
 * ```
 */
export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
}
