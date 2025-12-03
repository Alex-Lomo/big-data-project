import { notifications } from '@mantine/notifications';
import type { NotificationData } from '@mantine/notifications';
import { IconAlertTriangle } from '@tabler/icons-react';

interface NotifyErrorOptions extends Partial<NotificationData> {
    message: string;
    title?: string;
}

export function notifyError({
    message,
    color = 'red',
    title = 'A apărut o eroare',
    icon = <IconAlertTriangle size={18} />,
    withBorder = true,
    ...rest
}: NotifyErrorOptions) {
    notifications.show({
        color,
        icon,
        title,
        message,
        withBorder,
        ...rest,
    });
}
