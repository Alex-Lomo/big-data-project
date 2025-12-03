import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import type { IconProps } from '@tabler/icons-react';
import { useMemo } from 'react';
import {
    Line,
    LineChart,
    ResponsiveContainer,
    YAxis,
    XAxis,
    Tooltip,
} from 'recharts';
import type { SensorReading } from '../../stores/sensor-store';

export interface MetricCardProps {
    title: string;
    value?: number;
    unit?: string;
    change?: number;
    Icon?: React.ComponentType<IconProps>;
    sparkline?: SensorReading[];
}

export function MetricCard({
    title,
    value,
    unit,
    change,
    Icon,
    sparkline = [],
}: MetricCardProps) {
    const delta =
        change !== undefined && change !== 0
            ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
            : '—';

    const chartData = useMemo(
        () =>
            sparkline.map((v, i) => ({
                x: i,
                y: v.value,
            })),
        [sparkline],
    );

    const [minY, maxY] = useMemo(() => {
        if (!sparkline.length) return [0, 1];
        const min = Math.min(...sparkline.map((v) => v.value));
        const max = Math.max(...sparkline.map((v) => v.value));
        const span = Math.max(0.5, max - min);
        const pad = Math.max(0.25, span * 0.25);
        return [min - pad, max + pad];
    }, [sparkline]);

    return (
        <Card withBorder radius="md" padding="md" shadow="sm">
            <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                    <Group gap="xs">
                        {Icon && (
                            <ThemeIcon variant="light">
                                <Icon size={16} />
                            </ThemeIcon>
                        )}
                        <Text fw={600}>{title}</Text>
                    </Group>
                </Group>
                <Group justify="space-between" align="baseline">
                    <Text fz={24} fw={700}>
                        {value !== undefined ? value.toFixed(1) : '—'}
                        {unit && (
                            <Text span fz="sm" c="dimmed" ml={6}>
                                {unit}
                            </Text>
                        )}
                    </Text>
                    <Text
                        fz="sm"
                        c={change !== undefined && change < 0 ? 'red' : 'teal'}
                    >
                        {delta}
                    </Text>
                </Group>
                <div style={{ width: '100%', height: 100 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={chartData}
                            margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
                        >
                            <XAxis dataKey="x" hide />
                            <YAxis
                                dataKey="y"
                                width={34}
                                tick={{
                                    fill: 'var(--mantine-color-dimmed)',
                                    fontSize: 11,
                                }}
                                tickLine={false}
                                axisLine={false}
                                domain={[minY, maxY]}
                                tickFormatter={(v) => v.toFixed(0)}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--mantine-color-body)',
                                    border: '1px solid var(--paper-border-color)',
                                    padding: '4px 6px',
                                    borderRadius: '6px',
                                    fontSize: 'var(--mantine-font-size-xs)',
                                }}
                                labelFormatter={(idx: number) => {
                                    const ts = sparkline[idx]?.timestamp;
                                    return ts
                                        ? new Date(ts).toLocaleTimeString([], {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              second: '2-digit',
                                          })
                                        : '';
                                }}
                                formatter={(v: number) => [v.toFixed(2), title]}
                            />
                            <Line
                                type="monotone"
                                dataKey="y"
                                stroke={
                                    (change ?? 1) > 0
                                        ? 'var(--mantine-color-green-5)'
                                        : 'var(--mantine-color-red-5)'
                                }
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                {/* <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={chartData}
                            margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
                        >
                            <YAxis
                                width={32}
                                tick={{
                                    fill: 'var(--mantine-color-dimmed)',
                                    fontSize: 11,
                                }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <XAxis dataKey="x" hide />
                            <RechartsTooltip
                                contentStyle={{
                                    background: 'var(--mantine-color-body)',
                                    border: '1px solid var(--mantine-color-gray-3)',
                                }}
                                labelFormatter={() => ''}
                                formatter={(v: number) => [v.toFixed(1), title]}
                            />
                            <Line
                                type="monotone"
                                dataKey="y"
                                stroke={
                                    (change ?? 1) > 0
                                        ? 'var(--mantine-color-green-5)'
                                        : 'var(--mantine-color-red-5)'
                                }
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div> */}
            </Stack>
        </Card>
    );
}
