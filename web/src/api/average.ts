import { useQuery } from '@tanstack/react-query';

export type AverageStats = {
    Temperature: number;
    Humidity: number;
    Rainfall: number;
    Nitrogen: number;
    Potassium: number;
    Phosphorous: number;
};

export type AverageResponse = Record<string, AverageStats>;

export type AverageItem = { crop: string } & AverageStats;

const API_BASE =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    'http://localhost:3000';

const fetchAverage = async (): Promise<AverageResponse> => {
    const res = await fetch(`${API_BASE}/average`);
    if (!res.ok) {
        throw new Error(`Failed to fetch /average (${res.status})`);
    }
    return res.json();
};

export const useAverageQuery = () =>
    useQuery({
        queryKey: ['average'],
        queryFn: fetchAverage,
        select: (data): AverageItem[] =>
            Object.entries(data).map(([crop, stats]) => ({
                crop,
                ...stats,
            })),
    });
