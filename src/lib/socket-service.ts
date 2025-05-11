import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/lib/constants';

/**
 * Socket.IO client service for managing real-time connections
 */
class SocketService {
  private socket: Socket | null = null;
  private connectionListeners: Set<() => void> = new Set();
  private disconnectionListeners: Set<() => void> = new Set();
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnecting: boolean = false;

  /**
   * Initialize the Socket.IO connection
   * @param token Access token for authentication
   * @param userId User ID
   * @param profileId Profile ID
   */
  connect(token: string, userId: string, profileId: string): void {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      // Extract the base URL without the /api path
      let socketUrl = API_URL;
      if (socketUrl.endsWith('/api')) {
        socketUrl = socketUrl.substring(0, socketUrl.length - 4);
      }

      // Make sure we have the protocol
      if (!socketUrl.startsWith('http')) {
        socketUrl = `https://${socketUrl}`;
      }

      // For local development, use localhost directly
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        socketUrl = 'http://localhost:3000';
      }

      console.log(`Connecting to socket at: ${socketUrl}`);

      // For local development, disable socket connection temporarily
      // This prevents the constant connection errors while we focus on other features
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log('Socket connection disabled in local development to prevent errors');
        // Create a mock socket that doesn't actually connect
        this.socket = {
          connected: false,
          on: (event: string, callback: any) => {},
          off: (event: string, callback: any) => {},
          emit: (event: string, data: any) => {},
          connect: () => {},
          disconnect: () => {},
          close: () => {},
          io: { reconnection: () => {} }
        } as any;

        // Notify listeners that we're "disconnected"
        setTimeout(() => this.notifyDisconnectionListeners(), 100);

        return;
      }

      // Create Socket.IO connection with more robust options
      this.socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['polling', 'websocket'], // Start with polling, then upgrade to websocket
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 1, // Reduce attempts to avoid excessive retries
        reconnectionDelay: 3000,
        timeout: 5000, // Shorter timeout
        forceNew: true, // Force a new connection
        auth: {
          token
        },
        query: {
          userId,
          profileId
        }
      });

    // Set up event handlers
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.notifyConnectionListeners();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.notifyDisconnectionListeners();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Notify listeners but don't keep retrying indefinitely
      this.notifyDisconnectionListeners();

      // If we've had multiple failures, stop trying to reconnect
      // Check against the configured maximum reconnection attempts
      if (this.socket && this.socket.io.opts.reconnectionAttempts && this.socket.io.opts.reconnectionAttempts > 1) {
        console.log('Too many reconnection attempts, stopping reconnection');

        try {
          // Disable reconnection
          this.socket.io.reconnection(false);

          // Close the connection completely
          setTimeout(() => {
            if (this.socket) {
              this.socket.close();
              this.socket = null;
            }
          }, 1000);
        } catch (e) {
          console.error('Error while stopping reconnection:', e);
        }
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
      this.reconnecting = true;
      // Expose reconnecting state globally for components to access
      if (typeof window !== 'undefined') {
        (window as any).socketReconnecting = true;
      }
    });

    this.socket.on('reconnect', () => {
      this.reconnecting = false;
      console.log('Socket reconnected');
      // Update global reconnecting state
      if (typeof window !== 'undefined') {
        (window as any).socketReconnecting = false;
      }
    });

    this.socket.on('reconnect_failed', () => {
      this.reconnecting = false;
      console.error('Socket reconnection failed');
      this.notifyDisconnectionListeners();
      // Update global reconnecting state
      if (typeof window !== 'undefined') {
        (window as any).socketReconnecting = false;
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.notifyDisconnectionListeners();
    });

    } catch (error) {
      console.error('Error initializing socket connection:', error);
      // Still notify listeners so UI can update accordingly
      this.notifyDisconnectionListeners();
    }
  }

  /**
   * Disconnect the Socket.IO connection
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if the socket is connected
   */
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  /**
   * Check if the socket is reconnecting
   */
  isReconnecting(): boolean {
    return this.reconnecting;
  }

  /**
   * Emit an event to the server
   * @param event Event name
   * @param data Event data
   */
  emit(event: string, data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Add a listener for a specific event
   * @param event Event name
   * @param callback Callback function
   */
  on(event: string, callback: (data: any) => void): void {
    // Add to our internal event listeners
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);

    // Add to socket if it exists
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove a listener for a specific event
   * @param event Event name
   * @param callback Callback function
   */
  off(event: string, callback: (data: any) => void): void {
    // Remove from our internal event listeners
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.delete(callback);
    }

    // Remove from socket if it exists
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Add a connection listener
   * @param callback Callback function
   */
  onConnect(callback: () => void): void {
    this.connectionListeners.add(callback);
  }

  /**
   * Remove a connection listener
   * @param callback Callback function
   */
  offConnect(callback: () => void): void {
    this.connectionListeners.delete(callback);
  }

  /**
   * Add a disconnection listener
   * @param callback Callback function
   */
  onDisconnect(callback: () => void): void {
    this.disconnectionListeners.add(callback);
  }

  /**
   * Remove a disconnection listener
   * @param callback Callback function
   */
  offDisconnect(callback: () => void): void {
    this.disconnectionListeners.delete(callback);
  }

  /**
   * Notify all connection listeners
   */
  private notifyConnectionListeners(): void {
    this.connectionListeners.forEach(callback => callback());
  }

  /**
   * Notify all disconnection listeners
   */
  private notifyDisconnectionListeners(): void {
    this.disconnectionListeners.forEach(callback => callback());
  }
}

// Create a singleton instance
export const socketService = new SocketService();
