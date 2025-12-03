import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type UseWebSocketOptions } from './types';
import { createWebSocketClient, type WSStatus } from '../client';

export function useWebSocket<TSend, TRecv>(
    url: string,
    opts: UseWebSocketOptions<TSend, TRecv>,
) {
    const {
        connectOnMount = true,
        reconnectOnUrlChange = true,
        ...clientOpts
    } = opts;

    const client = useMemo(
        () => createWebSocketClient<TSend, TRecv>(url, clientOpts),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            url, // re-create client if URL changes
            clientOpts.sendSchema,
            clientOpts.receiveSchema,
            clientOpts.protocols,
            clientOpts.autoReconnect,
            clientOpts.maxReconnectAttempts,
            clientOpts.backoff,
            clientOpts.connectTimeoutMs,
            clientOpts.heartbeatIntervalMs,
            clientOpts.serialize,
            clientOpts.deserialize,
            clientOpts.bufferWhileConnecting,
            clientOpts.bufferLimit,
        ],
    );

    const [status, setStatus] = useState<WSStatus>(client.getStatus());
    const [lastMessage, setLastMessage] = useState<TRecv | null>(null);
    const [error, setError] = useState<unknown>(null);

    const mountedRef = useRef(false);

    useEffect(() => {
        const offStatus = client.onStatus((s) => {
            setStatus(s);
            if (s === 'error') setError(new Error('WebSocket error'));
        });
        const offMsg = client.subscribe((m) => setLastMessage(m));
        return () => {
            offStatus();
            offMsg();
        };
    }, [client]);

    useEffect(() => {
        mountedRef.current = true;

        if (connectOnMount) {
            client.connect();
        }

        return () => {
            mountedRef.current = false;
            // Clean up the socket instance on unmount
            client.disconnect(1000, 'component-unmount');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, connectOnMount, reconnectOnUrlChange ? url : undefined]);

    const send = useCallback((data: TSend) => client.send(data), [client]);

    const connect = useCallback(() => client.connect(), [client]);

    const disconnect = useCallback(
        (code?: number, reason?: string) => client.disconnect(code, reason),
        [client],
    );

    return {
        // state
        status,
        lastMessage,
        error,

        // controls
        send,
        connect,
        disconnect,

        // access
        socket: client.getSocket(),
        client,
    };
}
