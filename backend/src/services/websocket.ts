import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { verifyToken, TokenPayload } from '../utils/auth';

interface AuthenticatedSocket extends WebSocket {
  user?: TokenPayload;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;

  public initialize(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const payload = verifyToken(token);
      if (!payload) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      this.wss?.handleUpgrade(request, socket, head, (ws) => {
        (ws as AuthenticatedSocket).user = payload;
        this.wss?.emit('connection', ws, request);
      });
    });

    this.wss.on('connection', (ws: AuthenticatedSocket) => {
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
  public broadcast(type: string, data: any, siteId?: string | null) {
    if (!this.wss) return;

    const payload = JSON.stringify({ type, data });

    this.wss.clients.forEach((client) => {
      const wsClient = client as AuthenticatedSocket;
      if (wsClient.readyState === WebSocket.OPEN && wsClient.user) {
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

export const webSocketService = new WebSocketService();
