import { ZodType } from 'zod';

export interface WSClientOptions<TSend, TRecv> {
    // WebSocket constructor options
    protocols?: string | string[];

    // Validation
    sendSchema: ZodType<TSend>;
    receiveSchema: ZodType<TRecv>;

    // Lifecycle
    autoReconnect?: boolean; // default: true
    maxReconnectAttempts?: number; // default: Infinity
    backoff?: BackoffStrategy; // default: exponential w/ jitter
    connectTimeoutMs?: number; // default: 15_000

    // Heartbeat (app-level; browser WS does not support TCP ping)
    heartbeatIntervalMs?: number; // default: 25_000 (disabled if undefined)
    heartbeatPayload?: TSend | (() => TSend); // validated against sendSchema
    stopHeartbeatWhenHidden?: boolean; // default: true

    // Serialization
    serialize?: Serializer<TSend>; // default: JSON.stringify
    deserialize?: Deserializer; // default: JSON.parse

    // Incoming message handler (in addition to subscriptions)
    onMessage?: (msg: TRecv) => void;

    // Status changes
    onStatusChange?: (status: WSStatus) => void;

    // Optional initial buffer for outgoing messages while connecting
    bufferWhileConnecting?: boolean; // default: true
    bufferLimit?: number;
}

export interface WSClient<TSend, TRecv> {
    url: string;
    getStatus(): WSStatus;
    getSocket(): WebSocket | null;

    connect(): void;
    disconnect(code?: number, reason?: string): void;

    send(data: TSend): boolean; // returns true if sent/buffered; false if dropped due to buffer full
    subscribe(handler: (msg: TRecv) => void): () => void;
    subscribeRaw(handler: (ev: MessageEvent) => void): () => void;

    onStatus(handler: (s: WSStatus) => void): () => void;

    // helpers
    flushBuffer(): void;
    clearBuffer(): void;
}

// -----------------------------
// Types & Utilities
// -----------------------------

export type WSStatus =
    | 'idle'
    | 'connecting'
    | 'open'
    | 'closing'
    | 'closed'
    | 'reconnecting'
    | 'error';

export type BackoffStrategy = (attempt: number) => number; // ms
export type Serializer<T> = (
    data: T,
) => string | ArrayBufferLike | Blob | ArrayBufferView;
export type Deserializer = (data: unknown) => unknown;
