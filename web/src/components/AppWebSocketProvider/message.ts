import z from 'zod';
import { sensors } from '../../types/sensors';

export const sendMessageSchema = z.object({});

export const receiveMessageSchema = z.union([
    z.object({
        type: z.literal('METRIC'),
        payload: z.object({
            name: z.enum(sensors),
            value: z.number(),
        }),
    }),
]);

export type Send = z.infer<typeof sendMessageSchema>;
export type Receive = z.infer<typeof receiveMessageSchema>;
