import { create } from 'zustand';
import type { Sensor } from '../types/sensors';

export type SensorReading = {
    sensor: Sensor;
    value: number;
    timestamp: number; // epoch ms
};

type SensorStoreState = {
    readings: Record<Sensor, SensorReading[]>;
    maxPoints: number;
    ticks: number[];
};

type SensorStoreActions = {
    addReading: (reading: SensorReading) => void;
    addBatch: (readings: SensorReading[]) => void;
    clear: () => void;
    setMaxPoints: (n: number) => void;
};

const emptyBuckets = (): Record<Sensor, SensorReading[]> => ({
    temperature: [],
    humidity: [],
    rainfall: [],
    nitrogen: [],
    potassium: [],
    phosphorous: [],
});

export const useSensorStore = create<SensorStoreState & SensorStoreActions>(
    (set) => ({
        readings: emptyBuckets(),
        maxPoints: 200,
        ticks: [],

        addReading: (reading) =>
            set((state) => {
                const bucket = state.readings[reading.sensor] || [];
                const next = [...bucket, reading];
                const capped =
                    next.length > state.maxPoints
                        ? next.slice(next.length - state.maxPoints)
                        : next;

                const now = Date.now();
                const ticks = [...state.ticks, now].filter(
                    (t) => now - t <= 60_000,
                );

                return {
                    readings: {
                        ...state.readings,
                        [reading.sensor]: capped,
                    },
                    ticks,
                };
            }),

        addBatch: (batch) =>
            set((state) => {
                const readings = { ...state.readings };
                batch.forEach((r) => {
                    const bucket = readings[r.sensor] || [];
                    const next = [...bucket, r];
                    readings[r.sensor] =
                        next.length > state.maxPoints
                            ? next.slice(next.length - state.maxPoints)
                            : next;
                });
                return { readings };
            }),

        clear: () => set({ readings: emptyBuckets() }),

        setMaxPoints: (n) =>
            set((state) => {
                const readings = Object.fromEntries(
                    Object.entries(state.readings).map(([sensor, arr]) => [
                        sensor,
                        arr.slice(Math.max(0, arr.length - n)),
                    ]),
                ) as Record<Sensor, SensorReading[]>;
                return { maxPoints: n, readings };
            }),
    }),
);

export const useSensorCurrentValue = (sensor: Sensor) =>
    useSensorStore((state) => {
        const bucket = state.readings[sensor] ?? [];
        return bucket.length ? bucket[bucket.length - 1] : undefined;
    });

export const useSensorLastData = (sensor: Sensor, count = 30) =>
    useSensorStore((state) => {
        const bucket = state.readings[sensor] ?? [];
        return count > 0 ? bucket.slice(-count) : bucket;
    });

// export const selectors = {
//     all: (state: SensorStoreState) => state.readings,
//     bySensor: (sensor: SensorName) => (state: SensorStoreState) =>
//         state.readings[sensor],
// };
