import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedClients = new Map();
    }

    initialize(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.NODE_ENV === 'development' 
                    ? true 
                    : process.env.CORS_ORIGIN || 'http://192.168.0.9:3000',
                credentials: true
            },
            pingTimeout: 10000,
            pingInterval: 5000,
            transports: ['polling', 'websocket'],
            allowUpgrades: true,
            upgradeTimeout: 10000,
            maxHttpBufferSize: 1e6
        });

        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;
                
                this.connectedClients.set(socket.id, {
                    userId: decoded.userId,
                    role: decoded.role
                });
                
                next();
            } catch (error) {
                console.error('WebSocket authentication error:', error);
                next(new Error('Authentication failed'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });

            socket.on('error', (error) => {
                console.error(`Socket error for client ${socket.id}:`, error);
            });
        });

        console.log('WebSocket server initialized');
    }

    // Emit cart updates to specific user
    emitCartUpdate(userId, cartData) {
        if (!this.io) return;

        const userSockets = Array.from(this.connectedClients.entries())
            .filter(([_, client]) => client.userId === userId)
            .map(([socketId]) => socketId);

        userSockets.forEach(socketId => {
            this.io.to(socketId).emit('cartUpdate', cartData);
        });
    }

    // Broadcast to all authenticated clients
    broadcast(event, data, role = null) {
        if (!this.io) return;

        const targetSockets = Array.from(this.connectedClients.entries())
            .filter(([_, client]) => !role || client.role === role)
            .map(([socketId]) => socketId);

        targetSockets.forEach(socketId => {
            this.io.to(socketId).emit(event, data);
        });
    }

    // Get singleton instance
    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }
}

export default WebSocketService.getInstance();