import { useMemo } from 'react';
import {
    receiveMessageSchema,
    sendMessageSchema,
    type Receive,
    type Send,
} from './message';
import { WebSocketContext } from './websocket-context';
import { useWebSocket } from '../../libs/websocket';
import { useSensorStore } from '../../stores/sensor-store';

export type WebSocketContextValue = ReturnType<
    typeof useWebSocket<Send, Receive>
>;

export interface AppWebSocketProviderProps {
    children: React.ReactNode;
    url?: string;
    connectOnMount?: boolean;
}

export function AppWebSocketProvider({
    children,
    url,
    connectOnMount = true,
}: AppWebSocketProviderProps) {
    const wsUrl = useMemo(() => {
        return (
            url ??
            (import.meta.env?.VITE_WS_URL as string | undefined) ??
            `ws${location.protocol === 'https:' ? 's' : ''}://${location.host}`
        );
    }, [url]);

    const api = useWebSocket<Send, Receive>(wsUrl, {
        sendSchema: sendMessageSchema,
        receiveSchema: receiveMessageSchema,
        autoReconnect: true,
        connectOnMount,
        onMessage: (msg) => {
            switch (msg.type) {
                case 'METRIC':
                    const { name, value } = msg.payload;
                    useSensorStore.getState().addReading({
                        sensor: name,
                        value,
                        timestamp: Date.now(),
                    });
                    break;
                default:
                    console.warn('Not implemented:', msg.type);
            }
        },
        onStatusChange: (status) => {
            console.log('ws status changed:', status);
        },
    });

    const value = useMemo<WebSocketContextValue>(() => api, [api]);

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}
