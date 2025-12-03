import React, { useEffect, useMemo, useState } from 'react';
import {
    Card,
    Group,
    Text,
    Badge,
    Menu,
    ActionIcon,
    Button,
    Tooltip,
    Divider,
    Textarea,
    Stack,
    Code,
    CopyButton,
    rem,
} from '@mantine/core';
import {
    IconDots,
    IconPlayerPlay,
    IconPlayerPause,
    IconPlugConnected,
    IconPlugConnectedX,
    IconTrash,
    IconSend,
    IconInfoCircle,
} from '@tabler/icons-react';
import type { WSClient, WSStatus } from '../../client'; // <- adjust import path

type AnyClient = WSClient<unknown, unknown>;

export interface WebSocketDevToolsProps {
    client: AnyClient;
    status?: WSStatus; // optional override if you already track status via hook
    title?: string; // header text
    showSend?: boolean; // show "Send raw JSON" box
    collapsed?: boolean; // if true, render compact header-only card
    className?: string;
    style?: React.CSSProperties;
}

const statusColor = (s: WSStatus): string => {
    switch (s) {
        case 'idle':
            return 'gray';
        case 'connecting':
            return 'yellow';
        case 'open':
            return 'green';
        case 'reconnecting':
            return 'orange';
        case 'closing':
            return 'yellow';
        case 'closed':
            return 'gray';
        case 'error':
            return 'red';
        default:
            return 'gray';
    }
};

export function WebSocketDevTools({
    client,
    status: externalStatus,
    title = 'WebSocket DevTools',
    showSend = true,
    collapsed = false,
    className,
    style,
}: WebSocketDevToolsProps) {
    const [status, setStatus] = useState<WSStatus>(
        externalStatus ?? client.getStatus(),
    );
    const [blockedReconnect, setBlockedReconnect] = useState(false);
    const [raw, setRaw] = useState<string>('{"type":"ping"}');
    const [sendOk, setSendOk] = useState<boolean | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    const socket = client.getSocket();

    // Keep status in sync with client events if externalStatus not provided
    useEffect(() => {
        if (externalStatus) {
            setStatus(externalStatus);
            return;
        }
        const off = client.onStatus((s) => setStatus(s));
        return () => off();
    }, [client, externalStatus]);

    // "Force close / disallow reconnect" guard:
    // If blockedReconnect is on and the client tries to reconnect or opens,
    // immediately disconnect again.
    useEffect(() => {
        if (!blockedReconnect) return;
        if (
            status === 'reconnecting' ||
            status === 'connecting' ||
            status === 'open'
        ) {
            client.disconnect(4001, 'devtools-blocked');
        }
    }, [blockedReconnect, status, client]);

    const statusBadge = useMemo(
        () => (
            <Badge color={statusColor(status)} variant="filled">
                {status.toUpperCase()}
            </Badge>
        ),
        [status],
    );

    const handleConnect = () => {
        setLastError(null);
        try {
            client.connect();
        } catch (e: any) {
            setLastError(String(e?.message ?? e));
        }
    };

    const handleClose = (code?: number, reason?: string) => {
        setLastError(null);
        try {
            client.disconnect(code, reason);
        } catch (e: any) {
            setLastError(String(e?.message ?? e));
        }
    };

    const handleForceClose = () => {
        setBlockedReconnect(true);
        handleClose(4001, 'devtools-forced-close');
    };

    const handleAllowReconnect = () => {
        setBlockedReconnect(false);
    };

    const handleFlush = () => {
        try {
            client.flushBuffer();
        } catch (e: any) {
            setLastError(String(e?.message ?? e));
        }
    };

    const handleClear = () => {
        try {
            client.clearBuffer();
        } catch (e: any) {
            setLastError(String(e?.message ?? e));
        }
    };

    const prettyUrl = (() => {
        try {
            return new URL(client.url).toString();
        } catch {
            return client.url;
        }
    })();

    const canConnect =
        status === 'idle' || status === 'closed' || status === 'error';
    const canClose =
        status === 'open' ||
        status === 'reconnecting' ||
        status === 'connecting' ||
        status === 'closing';

    return (
        <Card withBorder radius="md" className={className} style={style}>
            <Group justify="space-between" align="center">
                <Group>
                    <Text fw={600}>{title}</Text>
                    {statusBadge}
                    <Tooltip label={prettyUrl}>
                        <Group gap="xs">
                            <IconInfoCircle size={16} />
                            <Code fz="xs" style={{ userSelect: 'text' }}>
                                {prettyUrl}
                            </Code>
                        </Group>
                    </Tooltip>
                </Group>

                <Group gap="xs">
                    {!blockedReconnect ? (
                        <Tooltip label="Block reconnect & force close">
                            <ActionIcon
                                variant="light"
                                color="red"
                                onClick={handleForceClose}
                                aria-label="Force close and block reconnect"
                            >
                                <IconPlugConnectedX size={16} />
                            </ActionIcon>
                        </Tooltip>
                    ) : (
                        <Tooltip label="Allow reconnect again">
                            <ActionIcon
                                variant="light"
                                color="green"
                                onClick={handleAllowReconnect}
                                aria-label="Allow reconnect"
                            >
                                <IconPlugConnected size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {canConnect && !blockedReconnect && (
                        <Tooltip label="Connect">
                            <ActionIcon
                                variant="light"
                                onClick={handleConnect}
                                aria-label="Connect"
                            >
                                <IconPlayerPlay size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    {canClose && (
                        <Tooltip label="Graceful close (1000)">
                            <ActionIcon
                                variant="light"
                                color="yellow"
                                onClick={() =>
                                    handleClose(1000, 'devtools-close')
                                }
                                aria-label="Close"
                            >
                                <IconPlayerPause size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}

                    <Menu withinPortal>
                        <Menu.Target>
                            <ActionIcon variant="subtle" aria-label="More">
                                <IconDots size={18} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Label>Connection</Menu.Label>
                            <Menu.Item
                                leftSection={<IconPlayerPlay size={14} />}
                                onClick={handleConnect}
                                disabled={!canConnect || blockedReconnect}
                            >
                                Connect
                            </Menu.Item>
                            <Menu.Item
                                leftSection={<IconPlayerPause size={14} />}
                                onClick={() =>
                                    handleClose(1000, 'devtools-close')
                                }
                                disabled={!canClose}
                            >
                                Close (1000)
                            </Menu.Item>
                            <Menu.Item
                                color="red"
                                leftSection={<IconPlugConnectedX size={14} />}
                                onClick={handleForceClose}
                            >
                                Force close & block reconnect
                            </Menu.Item>
                            <Menu.Item
                                leftSection={<IconPlugConnected size={14} />}
                                onClick={handleAllowReconnect}
                                disabled={!blockedReconnect}
                            >
                                Allow reconnect
                            </Menu.Item>

                            <Divider my="xs" />

                            <Menu.Label>Buffer</Menu.Label>
                            <Menu.Item
                                leftSection={<IconSend size={14} />}
                                onClick={handleFlush}
                            >
                                Flush buffer
                            </Menu.Item>
                            <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={handleClear}
                            >
                                Clear buffer
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Group>

            {!collapsed && (
                <>
                    <Divider my="sm" />

                    <Group grow align="start">
                        <Stack gap={6}>
                            <Text fw={500} fz="sm">
                                Socket
                            </Text>
                            <Code fz="xs">
                                readyState:{' '}
                                {String(socket?.readyState ?? 'n/a')}
                            </Code>
                            <Code fz="xs">
                                protocol: {String(socket?.protocol ?? 'n/a')}
                            </Code>
                            <Code fz="xs">
                                binaryType:{' '}
                                {String(socket?.binaryType ?? 'n/a')}
                            </Code>
                            <CopyButton value={prettyUrl}>
                                {({ copied, copy }) => (
                                    <Button
                                        size="xs"
                                        variant={copied ? 'light' : 'outline'}
                                        onClick={copy}
                                    >
                                        {copied ? 'Copied URL' : 'Copy URL'}
                                    </Button>
                                )}
                            </CopyButton>
                        </Stack>

                        {showSend && (
                            <Stack gap="xs">
                                <Text fw={500} fz="sm">
                                    Send raw JSON (validated by your sendSchema)
                                </Text>
                                <Textarea
                                    autosize
                                    minRows={3}
                                    maxRows={8}
                                    value={raw}
                                    onChange={(e) =>
                                        setRaw(e.currentTarget.value)
                                    }
                                    styles={{
                                        input: {
                                            fontFamily: 'monospace',
                                            fontSize: rem(12),
                                        },
                                    }}
                                />
                                <Group gap="xs">
                                    <Button
                                        size="xs"
                                        leftSection={<IconSend size={14} />}
                                        onClick={() => {
                                            setLastError(null);
                                            try {
                                                const data = JSON.parse(raw);
                                                const ok = client.send(data);
                                                setSendOk(ok);
                                                if (!ok)
                                                    setLastError(
                                                        'Message rejected by sendSchema or could not be queued.',
                                                    );
                                            } catch (e: any) {
                                                setSendOk(false);
                                                setLastError(
                                                    `Invalid JSON: ${String(e?.message ?? e)}`,
                                                );
                                            }
                                        }}
                                    >
                                        Send
                                    </Button>
                                    {sendOk !== null && (
                                        <Badge
                                            color={sendOk ? 'green' : 'red'}
                                            variant="light"
                                        >
                                            {sendOk ? 'SENT/QUEUED' : 'FAILED'}
                                        </Badge>
                                    )}
                                </Group>
                            </Stack>
                        )}
                    </Group>

                    {lastError && (
                        <>
                            <Divider my="sm" />
                            <Text c="red" fz="sm">
                                Error: {lastError}
                            </Text>
                        </>
                    )}
                </>
            )}
        </Card>
    );
}
