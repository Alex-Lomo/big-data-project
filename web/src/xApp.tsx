import { useMemo } from 'react';
import BarComparison from './components/old/BarComparison';
import Histogram from './components/old/Histogram';
import LiveLineChart from './components/old/LiveLineChart';
import MetricCard from './components/old/MetricCard';
import './xApp.css';

const sensors = [
    { name: 'Temperature', unit: '°C', baseline: 27, range: [22, 35] },
    { name: 'Humidity', unit: '%', baseline: 55, range: [40, 80] },
    { name: 'Rainfall', unit: 'mm', baseline: 42, range: [18, 80] },
    { name: 'Nitrogen', unit: 'kg/ha', baseline: 24, range: [12, 40] },
    { name: 'Potassium', unit: 'kg/ha', baseline: 18, range: [6, 32] },
    { name: 'Phosphorous', unit: 'kg/ha', baseline: 16, range: [8, 30] },
];

type LivePoint = {
    timestamp: Date;
    values: Record<string, number>;
};

const randomAround = (center: number, variance: number) =>
    center + (Math.random() - 0.5) * variance;

function App() {
    const liveData: LivePoint[] = useMemo(() => {
        const base = Date.now() - 29 * 60 * 1000;
        return Array.from({ length: 30 }, (_, i) => {
            const timestamp = new Date(base + i * 60 * 1000);
            const values: Record<string, number> = {};
            sensors.forEach((sensor, idx) => {
                const wave = Math.sin(i / (4 + idx)) * (idx + 1);
                values[sensor.name] = randomAround(
                    sensor.baseline + wave,
                    sensor.range[1] * 0.08,
                );
            });
            return { timestamp, values };
        });
    }, []);

    const latest = liveData[liveData.length - 1];
    const previous = liveData[liveData.length - 2];

    const metricCards = sensors.map((sensor) => {
        const spark = liveData.map((point) => point.values[sensor.name]);
        const value = latest.values[sensor.name];
        const change =
            previous && previous.values[sensor.name]
                ? ((value - previous.values[sensor.name]) /
                      previous.values[sensor.name]) *
                  100
                : 0;

        const status =
            value > sensor.range[1]
                ? 'warn'
                : value < sensor.range[0] * 0.8
                  ? 'alert'
                  : 'ok';

        return { ...sensor, value, change, spark, status };
    });

    const histograms = sensors.slice(0, 3).map((sensor, idx) => ({
        title: `${sensor.name} distribution`,
        data: Array.from({ length: 160 }, () =>
            randomAround(
                sensor.baseline + Math.sin(idx) * 3,
                sensor.range[1] * 0.2,
            ),
        ),
    }));

    const suggestions = [
        { crop: 'Maize', score: 0.78 },
        { crop: 'Sugarcane', score: 0.63 },
        { crop: 'Cotton', score: 0.42 },
    ];

    return (
        <div className="page">
            <header className="hero">
                <div>
                    <p className="eyebrow">Smart farm dashboard</p>
                    <h1>Sensor telemetry + algorithm insights</h1>
                    <p className="subhead">
                        Mocked data flowing through D3 charts. Swap in your
                        API/WebSocket feeds for live crops and sensor streams.
                    </p>
                    <div className="pills">
                        <span className="pill">Live mode</span>
                        <span className="pill neutral">
                            Batch window: last hour
                        </span>
                        <span className="pill">Alerts muted</span>
                    </div>
                </div>
                <div className="hero-meta">
                    <div className="meta-block">
                        <span className="meta-label">Last ingest</span>
                        <span className="meta-value">
                            ~{new Date().toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="meta-block">
                        <span className="meta-label">Algorithm</span>
                        <span className="meta-value accent">
                            k-NN crop suggester
                        </span>
                    </div>
                    <div className="meta-block">
                        <span className="meta-label">Throughput</span>
                        <span className="meta-value">512 msgs/min</span>
                    </div>
                </div>
            </header>

            <section className="metrics-grid">
                {metricCards.map((card) => (
                    <MetricCard
                        key={card.name}
                        title={card.name}
                        value={card.value}
                        unit={card.unit}
                        change={card.change}
                        status={card.status as 'ok' | 'warn' | 'alert'}
                        sparkline={card.spark}
                    />
                ))}
            </section>

            <section className="split">
                <div className="panel main-panel">
                    <div className="panel-header">
                        <div>
                            <div className="panel-title">
                                Live sensor signals
                            </div>
                            <div className="panel-subtitle">
                                Aligned across time — toggle per series as
                                needed.
                            </div>
                        </div>
                        <div className="toggles">
                            <button className="ghost">Pause</button>
                            <button className="ghost">Export</button>
                        </div>
                    </div>
                    <LiveLineChart
                        seriesNames={sensors.map((s) => s.name)}
                        data={liveData}
                    />
                </div>

                <div className="panel side-panel">
                    <div className="panel-header">
                        <div className="panel-title">Algorithm output</div>
                        <div className="panel-subtitle">
                            Top 3 crops + feature deltas vs averages.
                        </div>
                    </div>
                    <div className="suggestions">
                        {suggestions.map((sugg, idx) => (
                            <div key={sugg.crop} className="suggestion">
                                <div className="rank">{idx + 1}</div>
                                <div>
                                    <div className="suggestion-name">
                                        {sugg.crop}
                                    </div>
                                    <div className="suggestion-score">
                                        Score {Math.round(sugg.score * 100)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="panel-subtitle gap">
                        Current readings vs crop averages
                    </div>
                    <div className="bars">
                        {sensors.slice(0, 3).map((sensor) => (
                            <BarComparison
                                key={sensor.name}
                                label={sensor.name}
                                current={latest.values[sensor.name]}
                                baseline={sensor.baseline}
                                unit={sensor.unit}
                                max={sensor.range[1]}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid">
                {histograms.map((hist, idx) => (
                    <Histogram
                        key={hist.title}
                        title={hist.title}
                        data={hist.data}
                        color={
                            [
                                'var(--blue-500)',
                                'var(--amber-500)',
                                'var(--green-500)',
                            ][idx % 3]
                        }
                    />
                ))}
                <div className="panel events">
                    <div className="panel-title">Events & quality</div>
                    <ul>
                        <li>
                            Lag spike cleared — stream back to 120ms behind wall
                            clock.
                        </li>
                        <li>
                            Rainfall variance rising in the last 10 minutes.
                        </li>
                        <li>k-NN cache warm — serving in &lt; 15ms.</li>
                        <li>Next batch refresh scheduled in 4m.</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

export default App;
