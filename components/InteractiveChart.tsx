import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { OhlcData } from '../types';

interface InteractiveChartProps {
    data: OhlcData[];
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ data }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'var(--color-obsidian-slate)' },
                textColor: 'var(--color-muted-grey)',
            },
            grid: {
                vertLines: { color: 'var(--color-border)' },
                horzLines: { color: 'var(--color-border)' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });
        chartRef.current = chart;

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#28C76F',
            downColor: '#EA5455',
            borderDownColor: '#EA5455',
            borderUpColor: '#28C76F',
            wickDownColor: '#EA5455',
            wickUpColor: '#28C76F',
        });
        seriesRef.current = candlestickSeries;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            const formattedData: CandlestickData[] = data.map(d => ({
                time: (d.timestamp / 1000) as UTCTimestamp,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }));
            seriesRef.current.setData(formattedData);
            chartRef.current?.timeScale().fitContent();
        }
    }, [data]);

    return <div ref={chartContainerRef} className="w-full h-full" />;
};
