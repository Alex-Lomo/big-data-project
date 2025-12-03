import { createContext } from 'react';
import type { WebSocketContextValue } from './AppWebSocketProvider';

export const WebSocketContext = createContext<WebSocketContextValue | null>(
    null,
);
