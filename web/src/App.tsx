import { Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import classes from './App.module.css';
import { Header } from './components/Header/Header';
import { MetricCard } from './components/MetricCard';
import {
    IconCloudRain,
    IconDroplet,
    IconTemperature,
    IconAtom,
    IconFlask2,
    IconTestPipe,
    type IconProps,
} from '@tabler/icons-react';
import { useSensorStore } from './stores/sensor-store';
import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { sensors, type Sensor } from './types/sensors';
import { DistributionChart } from './components/DistributionChart';
import { AlgorithmResults } from './components/AlgorithmResults';
import { useAverageQuery } from './api/average';
import type { CropProps } from './components/AlgorithmResults/Crop';

const SensorMetadada: Record<
    Sensor,
    { title: string; unit: string; Icon: React.ComponentType<IconProps> }
> = {
    temperature: {
        title: 'Temperature',
        unit: '°C',
        Icon: IconTemperature,
    },
    humidity: {
        title: 'Humidity',
        unit: '%',
        Icon: IconDroplet,
    },
    rainfall: {
        title: 'Rainfall',
        unit: 'mm',
        Icon: IconCloudRain,
    },
    nitrogen: {
        title: 'Nitrogen',
        unit: 'kg/ha',
        Icon: IconAtom,
    },
    potassium: {
        title: 'Potassium',
        unit: 'kg/ha',
        Icon: IconFlask2,
    },
    phosphorous: {
        title: 'Phosphorous',
        unit: 'kg/ha',
        Icon: IconTestPipe,
    },
};

export default function App() {
    const sensorReadings = useSensorStore(useShallow((s) => s.readings));
    const sensorMetrics = useMemo(
        () =>
            sensors.map((sensor) => ({
                sensor,
                metadata: SensorMetadada[sensor],
                currentValue: sensorReadings[sensor].at(-1)?.value,
                readings: sensorReadings[sensor],
            })),
        [sensorReadings],
    );

    const { data: averageCropData } = useAverageQuery();
    const algorithmCropSuggestions = useMemo<CropProps[]>(
        () =>
            (averageCropData ?? []).map((crop) => {
                return {
                    name: crop.crop,
                    features: sensors.map((sensor) => ({
                        name: SensorMetadada[sensor].title,
                        unit: SensorMetadada[sensor].unit,
                        currentValue: sensorReadings[sensor].at(-1)?.value ?? 0,
                        averageValue: (crop as any)[
                            SensorMetadada[sensor].title
                        ] as number,
                    })),
                } satisfies CropProps;
            }),
        [averageCropData, sensorReadings],
    );

    const throughput = useSensorStore((s) => s.ticks.length);

    return (
        <Stack gap="lg" className={classes.page}>
            <Header throughput={throughput} />
            <Group gap="md" grow align="stretch" w="100%">
                {sensorMetrics.map((metric) => (
                    <MetricCard
                        key={metric.sensor}
                        title={metric.metadata.title}
                        unit={metric.metadata.unit}
                        Icon={metric.metadata.Icon}
                        value={metric.currentValue}
                        sparkline={metric.readings.slice(-20)}
                    />
                ))}
            </Group>
            <Card withBorder radius="md" shadow="sm" padding="md" flex={3}>
                <Stack gap="sm">
                    <Text fw={700}>Distributions</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {sensorMetrics.map((metric) => (
                            <DistributionChart
                                key={metric.sensor}
                                title={`${metric.metadata.title} distribution`}
                                unit={metric.metadata.unit}
                                values={metric.readings.map((r) => r.value)}
                                seriesLabel={metric.metadata.title}
                                SeriesIcon={metric.metadata.Icon}
                            />
                        ))}
                    </SimpleGrid>
                </Stack>
            </Card>

            <AlgorithmResults
                wrapperProps={{}}
                crops={algorithmCropSuggestions}
            />
        </Stack>
    );
}
