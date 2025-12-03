import * as d3 from 'd3';
import { useMemo } from 'react';

type SparklineProps = {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
};

export function Sparkline({
    data,
    color = 'var(--mantine-color-green-4)',
    width = 120,
    height = 50,
}: SparklineProps) {
    const { path, yDomain } = useMemo(() => {
        if (!data.length) {
            return { path: '', yDomain: [0, 1] as [number, number] };
        }

        const xScale = d3
            .scaleLinear()
            .domain([0, data.length - 1])
            .range([0, width]);
        const yScale = d3
            .scaleLinear()
            .domain(d3.extent(data) as [number, number])
            .nice()
            .range([height - 10, 8]);

        const line = d3
            .line<number>()
            .x((_, i) => xScale(i))
            .y((d) => yScale(d))
            .curve(d3.curveMonotoneX);

        return { path: line(data) ?? '', yDomain: yScale.domain() };
    }, [data]);

    return (
        <svg
            className="sparkline"
            viewBox={`0 0 ${width} ${height}`}
            role="presentation"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="sparkline-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={`${path}L${width},${height}L0,${height}Z`}
                fill="url(#sparkline-fill)"
                stroke="none"
                opacity="0.4"
            />
            <path d={path} fill="none" stroke={color} strokeWidth="2" />
            <line
                x1={0}
                x2={width}
                y1={d3.scaleLinear().domain(yDomain).range([height, 0])(0)}
                y2={d3.scaleLinear().domain(yDomain).range([height, 0])(0)}
                className="sparkline-baseline"
            />
        </svg>
    );
}
