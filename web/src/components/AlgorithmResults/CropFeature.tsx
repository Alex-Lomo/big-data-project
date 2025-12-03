import { Group, Progress, Text, ThemeIcon } from '@mantine/core';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

export interface CropFeatureProps {
    name: string;
    currentValue: number;
    averageValue: number;
    unit: string;
}

export function CropFeature({
    name,
    currentValue,
    averageValue,
    unit,
}: CropFeatureProps) {
    const delta = currentValue - averageValue;
    const up = delta >= 0;
    const magnitude =
        1 - Math.min(1, Math.abs(delta) / (Math.abs(averageValue) || 1));

    return (
        <Group justify="space-between">
            <Group gap={6}>
                <Text size="sm">{name}</Text>
                <Text size="xs" c="dimmed">
                    {currentValue.toFixed(1)}
                    {` ${unit}`}
                </Text>
            </Group>
            <Group gap={6}>
                <Text size="xs" c="dimmed">
                    avg {averageValue.toFixed(1)}
                    {` ${unit}`}
                </Text>
                <ThemeIcon
                    size="sm"
                    variant="light"
                    color={up ? 'green' : 'red'}
                >
                    {up ? (
                        <IconTrendingUp size={14} />
                    ) : (
                        <IconTrendingDown size={14} />
                    )}
                </ThemeIcon>
                <Progress
                    w={80}
                    value={magnitude * 100}
                    color={
                        up
                            ? 'var(--mantine-color-green-5)'
                            : 'var(--mantine-color-red-5)'
                    }
                />
                <Text size="xs" c="dimmed">
                    {(magnitude * 100).toFixed(1)}%
                </Text>
            </Group>
        </Group>
    );
}
