import { Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { HeaderStat } from './HeaderStat';
import { DarkModeToggle } from './DarkModeToggle';

type HeaderProps = {
    title?: string;
    subtitle?: string;
    description?: string;
    algoritm?: string;
    throughput?: number;
};

export function Header({
    title = 'Smart Farm Dashboard',
    subtitle = 'Sensor telemetry + algorithm insights',
    description = 'Monitoring pipeline for crop recommendations with live sensor feeds, algorithm health, and batch summaries.',
    algoritm = 'k-NN crop suggester',
    throughput,
}: HeaderProps) {
    return (
        <Card shadow="md" radius="md" p="lg" withBorder>
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                    <Stack gap={4} flex={1}>
                        <Title order={2}>{title}</Title>
                        <Text c="dimmed">{subtitle}</Text>
                        <Text size="sm">{description}</Text>
                    </Stack>
                    <DarkModeToggle />
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                    <HeaderStat title="Algorithm" value={algoritm} />
                    <HeaderStat
                        title="Throughput"
                        value={`${throughput ?? '-'} msgs/min`}
                    />
                    <HeaderStat title="Mode" value="Live" />
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
