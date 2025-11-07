import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, UTCTimestamp, LineStyle, CrosshairMode, PriceScaleMode, SeriesMarker, Time } from 'lightweight-charts';
import { OhlcData, BacktestTradeLog } from '../types';

interface InteractiveBacktestChartProps {
    data: OhlcData[];
    trades?: BacktestTradeLog[];
}

export const InteractiveBacktestChart: React.FC<InteractiveBacktestChartProps> = ({ data, trades = [] }) => {
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
            crosshair: {
                mode: CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'var(--color-border)',
                mode: PriceScaleMode.Logarithmic,
            },
            timeScale: {
                borderColor: 'var(--color-border)',
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

            const tradeMarkers: SeriesMarker<Time>[] = [];
            trades.forEach(trade => {
                const isWin = trade.outcome === 'Win';
                const isLong = trade.exitPrice > trade.entryPrice;

                // Entry Marker
                tradeMarkers.push({
                    time: (trade.entryTimestamp / 1000) as UTCTimestamp,
                    position: isLong ? 'belowBar' : 'aboveBar',
                    color: isLong ? '#28C76F' : '#EA5455',
                    shape: 'arrowUp',
                    text: `Entry @ ${trade.entryPrice.toFixed(4)}`
                });

                // Exit Marker
                tradeMarkers.push({
                    time: (trade.exitTimestamp / 1000) as UTCTimestamp,
                    position: isLong ? 'aboveBar' : 'belowBar',
                    color: '#9CA3AF',
                    shape: 'square',
                    text: `Exit @ ${trade.exitPrice.toFixed(4)}`
                });
            });

            seriesRef.current.setMarkers(tradeMarkers);
            
            if (chartRef.current) {
                chartRef.current.timeScale().fitContent();
            }
        }
    }, [data, trades]);

    return <div ref={chartContainerRef} className="w-full h-full" />;
};