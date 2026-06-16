import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/caisse', cors: { origin: '*' } })
export class CaisseGateway {
  @WebSocketServer()
  server!: Server;

  emitTransaction(transaction: unknown): void {
    this.server.emit('transaction.created', transaction);
  }

  emitSessionClosed(payload: unknown): void {
    this.server.emit('session.closed', payload);
  }
}
