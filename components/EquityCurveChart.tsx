import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import { BacktestTradeLog } from '../types';

interface EquityCurveChartProps {
  tradeLog: BacktestTradeLog[];
  avgRR: number;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[--color-dark-matter]/80 backdrop-blur-sm border border-[--color-border] p-3 rounded-md text-sm shadow-lg">
        <p className="label text-[--color-ghost-white]/80">{`Trade #${label}`}</p>
        <p className="intro text-[--color-neural-blue] font-semibold">{`Equity: ${payload[0].value.toFixed(2)}R`}</p>
      </div>
    );
  }

  return null;
};

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ tradeLog, avgRR }) => {

  const equityData = useMemo(() => {
    if (!tradeLog || tradeLog.length === 0) {
      return [{ tradeNumber: 0, equity: 0 }];
    }
    
    const data = [{ tradeNumber: 0, equity: 0 }];
    let currentEquity = 0;

    tradeLog.forEach((trade, index) => {
      if (trade.outcome === 'Win') {
        currentEquity += avgRR;
      } else {
        currentEquity -= 1; // Assume each loss is 1R
      }
      data.push({ tradeNumber: index + 1, equity: currentEquity });
    });

    return data;
  }, [tradeLog, avgRR]);
  
  const colors = {
      line: 'var(--color-neural-blue)',
      grid: 'var(--color-border)',
      tick: 'var(--color-muted-grey)',
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={equityData}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis
          dataKey="tradeNumber"
          stroke={colors.tick}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Number of Trades', position: 'insideBottom', offset: -10, fill: colors.tick, fontSize: 12 }}
        />
        <YAxis
          stroke={colors.tick}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Equity (R)', angle: -90, position: 'insideLeft', offset: 10, fill: colors.tick, fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="equity"
          stroke={colors.line}
          strokeWidth={2}
          dot={false}
          name="Equity Curve"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
