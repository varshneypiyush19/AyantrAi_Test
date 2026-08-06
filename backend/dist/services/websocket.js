"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSocketService = void 0;
const ws_1 = require("ws");
const auth_1 = require("../utils/auth");
class WebSocketService {
    wss = null;
    initialize(server) {
        this.wss = new ws_1.WebSocketServer({ noServer: true });
        server.on('upgrade', (request, socket, head) => {
            const url = new URL(request.url || '', `http://${request.headers.host}`);
            const token = url.searchParams.get('token');
            if (!token) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            const payload = (0, auth_1.verifyToken)(token);
            if (!payload) {
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                socket.destroy();
                return;
            }
            this.wss?.handleUpgrade(request, socket, head, (ws) => {
                ws.user = payload;
                this.wss?.emit('connection', ws, request);
            });
        });
        this.wss.on('connection', (ws) => {
            console.log(`WebSocket client connected: ${ws.user?.email} (${ws.user?.role})`);
            ws.on('message', (message) => {
                console.log(`Received message from ${ws.user?.email}:`, message.toString());
            });
            ws.on('close', () => {
                console.log(`WebSocket client disconnected: ${ws.user?.email}`);
            });
        });
    }
    /**
     * Broadcast a message to clients.
     * - Admins get all messages.
     * - Supervisors only get messages related to their assigned siteId.
     */
    broadcast(type, data, siteId) {
        if (!this.wss)
            return;
        const payload = JSON.stringify({ type, data });
        this.wss.clients.forEach((client) => {
            const wsClient = client;
            if (wsClient.readyState === ws_1.WebSocket.OPEN && wsClient.user) {
                const user = wsClient.user;
                // Admin gets everything
                if (user.role === 'ADMIN') {
                    wsClient.send(payload);
                }
                // Supervisor gets only their site's events
                else if (user.role === 'SUPERVISOR' && siteId && user.siteId === siteId) {
                    wsClient.send(payload);
                }
            }
        });
    }
}
exports.webSocketService = new WebSocketService();
