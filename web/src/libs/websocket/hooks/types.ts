import { type WSClientOptions } from '../client';

export interface UseWebSocketOptions<TSend, TRecv>
    extends WSClientOptions<TSend, TRecv> {
    // Auto-connect when the hook mounts
    connectOnMount?: boolean; // default: true
    // If url changes, should we reconnect automatically?
    reconnectOnUrlChange?: boolean; // default: true
}
