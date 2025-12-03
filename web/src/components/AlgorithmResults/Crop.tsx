import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { useMemo } from 'react';
import { CropFeature, type CropFeatureProps } from './CropFeature';

export interface CropProps {
    indicator?: string;
    name: string;
    features: CropFeatureProps[];
}

export function Crop({ indicator, name, features }: CropProps) {
    const featuresWithScores = useMemo(() => {
        return features.map((feature) => ({
            feature,
            score:
                1 -
                Math.min(
                    1,
                    Math.abs(feature.averageValue - feature.currentValue) /
                        (feature.averageValue || 1),
                ),
        }));
    }, [features]);
    const sortedFeaturesWithScores = useMemo(
        () => featuresWithScores.sort((a, b) => b.score - a.score),
        [featuresWithScores],
    );

    const generalScore = useMemo(() => {
        if (featuresWithScores.length == 0) return 0;

        const sum = featuresWithScores.reduce(
            (prev, crt) => prev + crt.score,
            0,
        );
        const avg = sum / featuresWithScores.length;
        return avg;
    }, [featuresWithScores]);

    return (
        <Card withBorder radius="md" padding="sm" shadow="xs">
            <Group justify="space-between" align="center">
                <Group gap="sm">
                    <ThemeIcon variant="light" color="blue">
                        {indicator}
                    </ThemeIcon>
                    <div>
                        <Text fw={600}>{name}</Text>
                        <Text size="sm" c="dimmed">
                            Score {`${(generalScore * 100).toFixed(1)}%`}
                        </Text>
                    </div>
                </Group>
                <Text fw={600} c="blue">
                    {`${(generalScore * 100).toFixed(1)}%`}
                </Text>
            </Group>
            <Stack gap={6} mt="xs">
                {sortedFeaturesWithScores.map(({ feature }) => (
                    <CropFeature key={feature.name} {...feature} />
                ))}
            </Stack>
        </Card>
    );
}
