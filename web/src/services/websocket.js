class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
    this.activeConnections = 0;
    this.isConnecting = false;
  }

  connect() {
    this.activeConnections++;
    
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Send authentication token and user ID if available
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (token && user.id) {
        this.socket.send(JSON.stringify({ 
          type: 'auth', 
          token,
          userId: user.id
        }));
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type && this.listeners.has(data.type)) {
          this.listeners.get(data.type).forEach(callback => callback(data.payload));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
        // Exponential backoff
        this.reconnectDelay *= 2;
      }, this.reconnectDelay);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  disconnect() {
    this.activeConnections--;
    
    // Only close the socket if there are no active connections
    if (this.activeConnections <= 0) {
      this.activeConnections = 0; // Reset to prevent negative counts
      
      // Cancel any pending connection
      if (this.isConnecting) {
        this.isConnecting = false;
      }
      
      // Only try to close if we have a socket and it's not already closing/closed
      if (this.socket && this.socket.readyState !== WebSocket.CLOSING && this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
      }
      this.socket = null;
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;