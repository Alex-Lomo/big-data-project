export const sensors = [
    'temperature',
    'humidity',
    'rainfall',
    'nitrogen',
    'potassium',
    'phosphorous',
] as const;

export type Sensor = (typeof sensors)[number];
