import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, applicationId: string): void;
    sendToAdmins(event: string, data: any): void;
    sendStatusUpdateToUser(applicationId: string, statusData: any): void;
}
