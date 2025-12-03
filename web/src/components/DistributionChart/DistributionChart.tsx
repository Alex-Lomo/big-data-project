import { Card, Group, Stack, Text } from '@mantine/core';
import type { IconProps } from '@tabler/icons-react';
import { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type DistributionChartProps = {
    title: string;
    unit?: string;
    values: number[];
    bins?: number;
    subtitle?: string;
    seriesLabel?: string;
    SeriesIcon?: React.ComponentType<IconProps>;
};

// Simple binning util
const buildHistogram = (values: number[], bins = 10) => {
    if (!values.length) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min || 1) / bins;
    const histogram = Array.from({ length: bins }, (_, i) => {
        const start = min + i * step;
        const end = start + step;
        const count = values.filter(
            (v) => v >= start && (i === bins - 1 ? v <= end : v < end),
        ).length;
        return {
            range: `${start.toFixed(0)}–${end.toFixed(0)}`,
            count,
        };
    });
    return histogram;
};

export function DistributionChart({
    title,
    unit,
    values,
    bins = 10,
    subtitle,
    seriesLabel,
    SeriesIcon,
}: DistributionChartProps) {
    const data = useMemo(() => buildHistogram(values, bins), [values, bins]);
    const maxCount = data.length ? Math.max(...data.map((d) => d.count)) : 1;

    return (
        <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                >
                    <Legend
                        content={({ width, align }) => (
                            <Group
                                w={width}
                                align={align}
                                justify="center"
                                gap={4}
                            >
                                {SeriesIcon && (
                                    <SeriesIcon
                                        size={16}
                                        color={'var(--mantine-color-blue-5)'}
                                    />
                                )}
                                {seriesLabel}
                            </Group>
                        )}
                    />
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--mantine-color-gray-3)"
                    />
                    <XAxis
                        dataKey="range"
                        tick={{
                            fill: 'var(--mantine-color-dimmed)',
                            fontSize: 10,
                        }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={40}
                    />
                    <YAxis
                        tick={{
                            fill: 'var(--mantine-color-dimmed)',
                            fontSize: 11,
                        }}
                        allowDecimals={false}
                        domain={[0, Math.max(maxCount, 1)]}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'var(--mantine-color-body)',
                            border: '1px solid var(--paper-border-color)',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            fontSize: 'var(--mantine-font-size-xs)',
                        }}
                        formatter={(v: number, _name, entry) => [
                            `${v} samples`,
                            unit
                                ? `${entry.payload.range} ${unit}`
                                : entry.payload.range,
                        ]}
                    />
                    <Bar
                        dataKey="count"
                        fill="var(--mantine-color-blue-5)"
                        radius={[4, 4, 0, 0]}
                        name={seriesLabel ?? title}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
