import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with CORS_ORIGIN config
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Allow clients to join rooms matching their application IDs for targeted updates
  @SubscribeMessage('joinApplicationRoom')
  handleJoinRoom(client: Socket, applicationId: string) {
    client.join(applicationId);
    this.logger.log(`Client ${client.id} joined room: ${applicationId}`);
  }

  // Broadcast events to all admins / dashboards
  sendToAdmins(event: string, data: any) {
    this.server.emit(`admin:${event}`, data);
  }

  // Send status update to specific application room
  sendStatusUpdateToUser(applicationId: string, statusData: any) {
    this.server.to(applicationId).emit('status:updated', statusData);
    this.server.emit('status:updated', statusData); // also broadcast globally for general dashboard tracking
  }
}
