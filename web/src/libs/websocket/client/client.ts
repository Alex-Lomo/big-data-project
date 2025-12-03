import {
    type BackoffStrategy,
    type WSClient,
    type WSClientOptions,
    type WSStatus,
} from './types';

export function createWebSocketClient<TSend, TRecv>(
    url: string,
    opts: WSClientOptions<TSend, TRecv>,
): WSClient<TSend, TRecv> {
    const {
        protocols,
        sendSchema,
        receiveSchema,
        autoReconnect = true,
        maxReconnectAttempts = Infinity,
        backoff = defaultBackoff,
        connectTimeoutMs = 15_000,
        heartbeatIntervalMs = 25_000,
        heartbeatPayload,
        stopHeartbeatWhenHidden = true,
        serialize = defaultSerialize,
        deserialize = defaultDeserialize,
        onMessage,
        onStatusChange,
        bufferWhileConnecting = true,
        bufferLimit = 100,
    } = opts;

    let ws: WebSocket | null = null;
    let status: WSStatus = 'idle';
    let reconnectAttempts = 0;
    let connectTimer: number | undefined;
    let heartbeatTimer: number | undefined;

    const subs = new Set<(msg: TRecv) => void>();
    const rawSubs = new Set<(ev: MessageEvent) => void>();
    const statusSubs = new Set<(s: WSStatus) => void>();

    const buffer: TSend[] = [];

    function setStatus(next: WSStatus) {
        status = next;
        onStatusChange?.(next);
        statusSubs.forEach((fn) => fn(next));
    }

    function startHeartbeat() {
        if (!heartbeatIntervalMs) return;
        stopHeartbeat();
        heartbeatTimer = window.setInterval(() => {
            if (
                stopHeartbeatWhenHidden &&
                document.visibilityState === 'hidden'
            )
                return;
            if (
                ws &&
                ws.readyState === WebSocket.OPEN &&
                heartbeatPayload !== undefined
            ) {
                const payload =
                    typeof heartbeatPayload === 'function'
                        ? (heartbeatPayload as () => TSend)()
                        : heartbeatPayload;
                // validate heartbeat against send schema (ignored if invalid)
                const res = sendSchema.safeParse(payload);
                if (res.success) {
                    try {
                        ws.send(serialize(res.data));
                    } catch {
                        /* no-op */
                    }
                }
            }
        }, heartbeatIntervalMs) as unknown as number;
    }

    function stopHeartbeat() {
        if (heartbeatTimer !== undefined) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = undefined;
        }
    }

    function flushBuffer() {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        while (buffer.length) {
            const item = buffer.shift()!;
            try {
                ws.send(serialize(item));
            } catch {
                // if a send fails, push it back and break
                buffer.unshift(item);
                break;
            }
        }
    }

    function clearBuffer() {
        buffer.length = 0;
    }

    function scheduleReconnect() {
        if (!autoReconnect) return;
        if (reconnectAttempts >= maxReconnectAttempts) return;
        setStatus('reconnecting');
        const delay = backoff(reconnectAttempts++);
        window.setTimeout(() => {
            connect();
        }, delay);
    }

    function safeClose(code?: number, reason?: string) {
        try {
            ws?.close(code, reason);
        } catch {
            // ignore
        }
    }

    function setupSocket() {
        if (ws) return;
        setStatus('connecting');
        ws = new WebSocket(url, protocols);

        // Connect timeout (guards against hanging "connecting")
        connectTimer = window.setTimeout(() => {
            if (ws && ws.readyState !== WebSocket.OPEN) {
                try {
                    ws.close(4000, 'connect-timeout');
                } catch {
                    /* no-op */
                }
            }
        }, connectTimeoutMs) as unknown as number;

        ws.onopen = () => {
            window.clearTimeout(connectTimer);
            setStatus('open');
            reconnectAttempts = 0;
            startHeartbeat();
            flushBuffer();
        };

        ws.onclose = () => {
            window.clearTimeout(connectTimer);
            stopHeartbeat();
            const wasOpen = status === 'open' || status === 'reconnecting';
            setStatus('closed');
            ws = null;
            if (wasOpen) scheduleReconnect();
            else if (autoReconnect) scheduleReconnect();
        };

        ws.onerror = () => {
            // Browser collapses error details; treat as transient error.
            setStatus('error');
        };

        ws.onmessage = (ev) => {
            rawSubs.forEach((fn) => fn(ev));
            let parsed: unknown;
            try {
                parsed = deserialize(ev.data);
            } catch {
                // Bad JSON or unsupported frame type -> ignore
                return;
            }
            const validated = receiveSchema.safeParse(parsed);
            if (!validated.success) {
                // Invalid message shape -> ignore
                return;
            }
            const msg = validated.data;
            onMessage?.(msg);
            subs.forEach((fn) => fn(msg));
        };
    }

    function connect() {
        if (
            ws &&
            (ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }
        setupSocket();
    }

    function disconnect(code?: number, reason?: string) {
        setStatus('closing');
        stopHeartbeat();
        window.clearTimeout(connectTimer);
        reconnectAttempts = 0;
        if (ws) {
            const ref = ws;
            ws = null;
            ref.onopen = ref.onclose = ref.onerror = ref.onmessage = null;
            safeClose(code, reason);
        }
        setStatus('closed');
    }

    function send(data: TSend): boolean {
        // Validate outgoing message
        const parsed = sendSchema.safeParse(data);
        if (!parsed.success) return false;

        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(serialize(parsed.data));
                return true;
            } catch {
                return false;
            }
        }
        if (!bufferWhileConnecting) return false;

        if (buffer.length >= bufferLimit) {
            // drop oldest to make room (or just drop this one; choose policy)
            buffer.shift();
        }
        buffer.push(parsed.data);
        // Optionally trigger a connect if not already connecting
        if (!ws || ws.readyState === WebSocket.CLOSED) connect();
        return true;
    }

    function subscribe(handler: (msg: TRecv) => void) {
        subs.add(handler);
        return () => subs.delete(handler);
    }

    function subscribeRaw(handler: (ev: MessageEvent) => void) {
        rawSubs.add(handler);
        return () => rawSubs.delete(handler);
    }

    function onStatus(handler: (s: WSStatus) => void) {
        statusSubs.add(handler);
        // emit current status immediately
        handler(status);
        return () => statusSubs.delete(handler);
    }

    return {
        url,
        getStatus: () => status,
        getSocket: () => ws,
        connect,
        disconnect,
        send,
        subscribe,
        subscribeRaw,
        onStatus,
        flushBuffer,
        clearBuffer,
    };
}

const defaultBackoff: BackoffStrategy = (attempt) => {
    const base = Math.min(20_000, 500 * Math.pow(2, attempt));
    const jitter = Math.random() * 0.2 * base;
    return base + jitter;
};

const defaultSerialize = <T>(data: T) => JSON.stringify(data);
const defaultDeserialize = (data: unknown) => {
    if (typeof data === 'string') return JSON.parse(data);
    return data;
};
