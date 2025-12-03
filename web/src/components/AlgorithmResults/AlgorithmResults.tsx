import {
    Card,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    type CardProps,
} from '@mantine/core';
import { Crop, type CropProps } from './Crop';
import { useMemo } from 'react';

export interface AlgorithmResultsProps {
    title?: string;
    subtitle?: string;
    crops?: CropProps[];
    wrapperProps?: CardProps;
}

export function AlgorithmResults({
    title = 'Algorithm results',
    subtitle = 'Top recommendations with feature comparison.',
    crops,
    wrapperProps,
}: AlgorithmResultsProps) {
    const cropsWithScores = useMemo(
        () =>
            (crops ?? []).map((crop) => {
                const featureScores = crop.features.map(
                    (feature) =>
                        1 -
                        Math.min(
                            1,
                            Math.abs(
                                feature.averageValue - feature.currentValue,
                            ) / (feature.averageValue || 1),
                        ),
                );
                const sum = featureScores.reduce((prev, crt) => prev + crt, 0);
                const avg =
                    crop.features.length == 0 ? 0 : sum / crop.features.length;

                return {
                    crop,
                    score: avg,
                };
            }),
        [crops],
    );
    const sortedCropsWithScores = useMemo(
        () => cropsWithScores.sort((a, b) => b.score - a.score),
        [cropsWithScores],
    );

    return (
        <Card withBorder radius="md" shadow="sm" padding="md" {...wrapperProps}>
            <Stack gap="sm">
                <div>
                    <Text fw={700}>{title}</Text>
                    <Text size="sm" c="dimmed">
                        {subtitle}
                    </Text>
                </div>
                <SimpleGrid cols={2}>
                    {sortedCropsWithScores?.map(({ crop }, idx) => (
                        <Crop
                            key={crop.name}
                            indicator={`${idx + 1}`}
                            {...crop}
                        />
                    ))}
                    {!top && (
                        <>
                            {new Array(5).fill(0).map((_, idx) => (
                                <Skeleton key={idx}>
                                    <Crop name="" features={[]} indicator="" />
                                </Skeleton>
                            ))}
                        </>
                    )}
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
