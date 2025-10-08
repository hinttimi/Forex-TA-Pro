import React from 'react';
import { OhlcData, BacktestTradeLog } from '../types';

interface OhlcChartProps {
    data: OhlcData[];
    trades?: BacktestTradeLog[];
    width?: number;
    height?: number;
}

export const OhlcChart: React.FC<OhlcChartProps> = ({ data, trades = [], width = 800, height = 400 }) => {
    if (!data || data.length === 0) {
        return <div style={{ width, height }} className="flex items-center justify-center bg-slate-900 text-slate-500 rounded-md">No chart data available to display.</div>;
    }

    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const minPrice = Math.min(...data.map(d => d.low));
    const maxPrice = Math.max(...data.map(d => d.high));
    const priceRange = maxPrice - minPrice;

    const candleWidth = chartWidth / data.length * 0.7;
    const candleMargin = chartWidth / data.length * 0.3;
    const totalCandleWidth = candleWidth + candleMargin;

    const getX = (index: number) => padding.left + index * totalCandleWidth + totalCandleWidth / 2;
    const getY = (price: number) => padding.top + chartHeight * (1 - (price - minPrice) / (priceRange || 1));

    const yAxisTicks = 5;
    const tickValues = Array.from({ length: yAxisTicks + 1 }, (_, i) => minPrice + i * (priceRange / yAxisTicks));

    const findDataIndex = (timestamp: number) => {
        // This is an approximation, but good enough for visualization
        if (data.length < 2) return 0;
        const first = data[0].timestamp;
        const last = data[data.length - 1].timestamp;
        const ratio = (timestamp - first) / (last - first);
        return Math.round(ratio * (data.length - 1));
    }

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* Y-Axis Grid Lines and Labels */}
            {tickValues.map((value, i) => (
                <g key={i}>
                    <line
                        x1={padding.left}
                        y1={getY(value)}
                        x2={width - padding.right}
                        y2={getY(value)}
                        stroke="#475569"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                    />
                    <text
                        x={width - padding.right + 5}
                        y={getY(value)}
                        dy="0.3em"
                        fill="#94a3b8"
                        fontSize="10"
                    >
                        {value.toFixed(4)}
                    </text>
                </g>
            ))}

            {/* Candlesticks */}
            {data.map((d, i) => {
                const x = getX(i);
                const yOpen = getY(d.open);
                const yClose = getY(d.close);
                const isBullish = d.close >= d.open;
                const bodyHeight = Math.abs(yOpen - yClose);
                const bodyY = isBullish ? yClose : yOpen;

                return (
                    <g key={d.timestamp}>
                        {/* Wick */}
                        <line
                            x1={x}
                            y1={getY(d.high)}
                            x2={x}
                            y2={getY(d.low)}
                            stroke={isBullish ? '#10b981' : '#f43f5e'}
                            strokeWidth="1"
                        />
                        {/* Body */}
                        <rect
                            x={x - candleWidth / 2}
                            y={bodyY}
                            width={candleWidth}
                            height={bodyHeight > 0 ? bodyHeight : 1}
                            fill={isBullish ? '#10b981' : '#f43f5e'}
                        />
                    </g>
                );
            })}

            {/* Trades */}
            {trades.map((trade, i) => {
                const entryIndex = findDataIndex(trade.entryTimestamp);
                const exitIndex = findDataIndex(trade.exitTimestamp);
                const entryX = getX(entryIndex);
                const exitX = getX(exitIndex);
                const entryY = getY(trade.entryPrice);
                const exitY = getY(trade.exitPrice);

                const isWin = trade.outcome === 'Win';
                const color = isWin ? '#10b981' : '#f43f5e';
                const isLong = trade.exitPrice > trade.entryPrice;

                return (
                    <g key={`trade-${i}`}>
                        <line
                            x1={entryX}
                            y1={entryY}
                            x2={exitX}
                            y2={exitY}
                            stroke={color}
                            strokeWidth="2"
                            strokeDasharray="4,4"
                        />
                         {/* Entry Marker */}
                        <circle cx={entryX} cy={entryY} r="4" fill={color} stroke="#1e293b" strokeWidth="2" />
                        <text x={entryX} y={isLong ? entryY + 15 : entryY - 8} fill={color} fontSize="10" textAnchor="middle">Entry</text>
                        
                        {/* Exit Marker */}
                         <circle cx={exitX} cy={exitY} r="4" fill={color} />
                         <text x={exitX} y={isLong ? exitY - 8 : exitY + 15} fill={color} fontSize="10" textAnchor="middle">Exit</text>
                    </g>
                )
            })}
        </svg>
    );
};
