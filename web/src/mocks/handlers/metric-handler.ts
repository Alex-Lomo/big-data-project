import type { WebSocketLink } from 'msw';
import type { Receive } from '../../components/AppWebSocketProvider/message';

const metrics: Receive['payload']['name'][] = [
    'temperature',
    'humidity',
    'rainfall',
    'nitrogen',
    'potassium',
    'phosphorous',
];

const baseValues: Record<Receive['payload']['name'], number> = {
    temperature: 22,
    humidity: 55,
    rainfall: 40,
    nitrogen: 24,
    potassium: 18,
    phosphorous: 16,
};

const jitter = (v: number, spread = 5) => v + (Math.random() - 0.5) * spread;

export const metricHandler = (live: WebSocketLink) =>
    live.addEventListener('connection', ({ client }) => {
        const timers: Partial<
            Record<Receive['payload']['name'], ReturnType<typeof setTimeout>>
        > = {};

        const startMetricSender = (metric: Receive['payload']['name']) => {
            const value = jitter(
                baseValues[metric],
                metric === 'temperature' ? 6 : 4,
            );
            client.send(
                JSON.stringify({
                    type: 'METRIC',
                    payload: {
                        name: metric,
                        value: Number(value.toFixed(2)),
                    },
                } satisfies Receive),
            );

            const nextDelay = 400 + Math.random() * 1600; // 0.4s - 2s

            const timer = setTimeout(
                () => startMetricSender(metric),
                nextDelay,
            );

            timers[metric] = timer;
        };

        metrics.map((metric) => startMetricSender(metric));

        client.addEventListener('close', () => {
            Object.values(timers).forEach((t) => t && clearTimeout(t));
        });
    });
