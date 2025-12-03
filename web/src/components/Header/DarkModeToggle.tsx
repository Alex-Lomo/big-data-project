import {
    ActionIcon,
    Tooltip,
    useComputedColorScheme,
    useMantineColorScheme,
} from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function DarkModeToggle() {
    const { setColorScheme } = useMantineColorScheme();
    const colorScheme = useComputedColorScheme('light', {
        getInitialValueInEffect: true,
    });

    const nextScheme = colorScheme === 'light' ? 'dark' : 'light';

    return (
        <Tooltip label={`Switch to ${nextScheme} mode`} withArrow>
            <ActionIcon
                variant="default"
                size="lg"
                radius="md"
                aria-label="Toggle color scheme"
                onClick={() => setColorScheme(nextScheme)}
            >
                {colorScheme === 'light' ? (
                    <IconMoon size={18} stroke={1.75} />
                ) : (
                    <IconSun size={18} stroke={1.75} />
                )}
            </ActionIcon>
        </Tooltip>
    );
}
