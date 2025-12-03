// WebSocketDevToolsFloating.tsx
// A tiny wrapper that shows a floating toggle button. When clicked, it opens
// your existing <WebSocketDevTools /> inside a fixed-position Card. Includes a
// close button in the header to hide it again.

import React, { useState } from 'react';
import { ActionIcon, Card, Group, Portal, Tooltip } from '@mantine/core';
import { IconBug, IconX } from '@tabler/icons-react';
import { type WSClient, type WSStatus } from '../../client';
import { WebSocketDevTools } from '../WebSocketDevTools/WebSocketDevTools';

type AnyClient = WSClient<any, any>;

export interface WebSocketDevToolsFloatingProps {
    client: AnyClient;
    status?: WSStatus;

    // Floating button config
    buttonAriaLabel?: string;
    buttonTooltip?: string;

    // Positioning (fixed)
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;

    // Panel sizing & style
    width?: number | string;
    height?: number | string;
    zIndex?: number;

    // Start opened?
    defaultOpen?: boolean;

    // Pass-through props to the inner DevTools
    title?: string;
    showSend?: boolean;
    collapsed?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export function WebSocketDevToolsFloating({
    client,
    status,

    buttonAriaLabel = 'Open WebSocket DevTools',
    buttonTooltip = 'Open WebSocket DevTools',

    // By default, render the FAB at bottom-right
    top,
    bottom = 24,
    left,
    right = 24,

    width = 520,
    height = 'auto',
    zIndex = 9999,

    defaultOpen = false,

    title = 'WebSocket DevTools',
    showSend = true,
    collapsed = false,
    className,
    style,
}: WebSocketDevToolsFloatingProps) {
    const [open, setOpen] = useState(defaultOpen);

    // Styles for the floating button (only shown when closed)
    const buttonStyle: React.CSSProperties = {
        position: 'fixed',
        ...(top !== undefined ? { top } : {}),
        ...(bottom !== undefined ? { bottom } : {}),
        ...(left !== undefined ? { left } : {}),
        ...(right !== undefined ? { right } : {}),
        zIndex,
    };

    // Styles for the floating panel (shown when open)
    const panelStyle: React.CSSProperties = {
        position: 'fixed',
        ...(top !== undefined ? { top } : {}),
        ...(bottom !== undefined ? { bottom } : {}),
        ...(left !== undefined ? { left } : {}),
        ...(right !== undefined ? { right } : {}),
        width,
        maxWidth: '90vw',
        maxHeight: '80vh',
        height,
        overflow: 'auto',
        zIndex,
    };

    return (
        <>
            {!open && (
                <Portal>
                    <div style={buttonStyle}>
                        <Tooltip label={buttonTooltip} openDelay={300}>
                            <ActionIcon
                                size="lg"
                                radius="xl"
                                variant="filled"
                                color="grape"
                                aria-label={buttonAriaLabel}
                                onClick={() => setOpen(true)}
                            >
                                <IconBug size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                </Portal>
            )}

            {open && (
                <Portal>
                    <Card
                        withBorder
                        shadow="md"
                        radius="md"
                        style={{ ...panelStyle, ...style }}
                        className={className}
                    >
                        <Group justify="space-between" align="center" mb="xs">
                            {/* Reuse the title prop; the inner DevTools shows its own title too,
                  but we add a small close affordance in this wrapper header. */}
                            <div style={{ fontWeight: 600 }}>{title}</div>
                            <ActionIcon
                                variant="subtle"
                                aria-label="Close WebSocket DevTools"
                                onClick={() => setOpen(false)}
                            >
                                <IconX size={18} />
                            </ActionIcon>
                        </Group>

                        {/* The actual DevTools */}
                        <WebSocketDevTools
                            client={client}
                            status={status}
                            title={title}
                            showSend={showSend}
                            collapsed={collapsed}
                        />
                    </Card>
                </Portal>
            )}
        </>
    );
}
