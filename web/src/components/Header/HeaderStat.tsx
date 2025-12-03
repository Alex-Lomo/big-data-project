import { Group, Paper, Stack, Text } from '@mantine/core';

export interface HeaderStatProps {
    title: string;
    value: string;
}

export function HeaderStat({ title, value }: HeaderStatProps) {
    return (
        <Paper p="sm" radius="md" withBorder>
            <Stack gap={6}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.5}>
                    {title}
                </Text>
                <Group gap={6}>
                    <Text fw={600}>{value}</Text>
                </Group>
            </Stack>
        </Paper>
    );
}
