import { Card, Group, Stack, Text } from '@mantine/core';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useMemo } from 'react';

type SensorPoint = { timestamp: Date; values: Record<string, number> };

export interface LiveSensorDataProps {
    data?: SensorPoint[];
    series?: string[];
    title?: string;
    subtitle?: string;
}

const palette = [
    '#5b84ff',
    '#22c55e',
    '#f59e0b',
    '#a855f7',
    '#22d3ee',
    '#ef4444',
];

const fallbackSeries = [
    'Temperature',
    'Humidity',
    'Rainfall',
    'Nitrogen',
    'Potassium',
    'Phosphorous',
];

export function LiveSensorData({
    data,
    series = fallbackSeries,
    title = 'Live sensor signals',
    subtitle = 'Streaming readings across all parameters.',
}: LiveSensorDataProps) {
    const defaultData = useMemo<SensorPoint[]>(() => {
        const base = Date.now() - 16 * 60 * 1000;
        return Array.from({ length: 17 }, (_, i) => {
            const timestamp = new Date(base + i * 60 * 1000);
            const values: Record<string, number> = {};
            series.forEach((name, idx) => {
                const baseValue = 20 + idx * 5;
                const wave = Math.sin(i / (3 + idx * 0.6)) * (idx + 1.2);
                values[name] = baseValue + wave + Math.random() * 2;
            });
            return { timestamp, values };
        });
    }, [series]);

    const chartData = data && data.length ? data : defaultData;

    const rechartsData = useMemo(
        () =>
            chartData.map((point) => ({
                time: point.timestamp.getTime(),
                ...point.values,
            })),
        [chartData],
    );

    return (
        <Card withBorder radius="md" shadow="sm" padding="md">
            <Stack gap="xs">
                <Group justify="space-between" align="center">
                    <Stack gap={2}>
                        <Text fw={700}>{title}</Text>
                        <Text size="sm" c="dimmed">
                            {subtitle}
                        </Text>
                    </Stack>
                </Group>
                <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                        <LineChart data={rechartsData} margin={{ top: 10, right: 16, bottom: 16, left: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--mantine-color-gray-3)" />
                            <XAxis
                                dataKey="time"
                                tickFormatter={(t) =>
                                    new Date(t as number).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })
                                }
                                tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 11 }}
                            />
                            <YAxis tick={{ fill: 'var(--mantine-color-dimmed)', fontSize: 11 }} />
                            <RechartsTooltip
                                contentStyle={{
                                    background: 'var(--mantine-color-body)',
                                    border: '1px solid var(--mantine-color-gray-3)',
                                }}
                                labelFormatter={(t) =>
                                    new Date(t as number).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })
                                }
                            />
                            <Legend />
                            {series.map((name, idx) => (
                                <Line
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stroke={palette[idx % palette.length]}
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Stack>
        </Card>
    );
}
