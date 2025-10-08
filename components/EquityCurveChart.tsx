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
import { useTheme } from '../hooks/useTheme';

interface EquityCurveChartProps {
  tradeLog: BacktestTradeLog[];
  avgRR: number;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-700/80 backdrop-blur-sm border border-slate-600 p-3 rounded-md text-sm">
        <p className="label text-slate-300">{`Trade #${label}`}</p>
        <p className="intro text-cyan-300">{`Equity: ${payload[0].value.toFixed(2)}R`}</p>
      </div>
    );
  }

  return null;
};

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ tradeLog, avgRR }) => {
  const { theme } = useTheme();

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
  
  const themeColors = {
      light: {
          line: '#0891b2', // cyan-600
          grid: '#e2e8f0', // slate-200
          tick: '#475569', // slate-600
          tooltipBg: 'rgba(255, 255, 255, 0.8)',
      },
      dark: {
          line: '#22d3ee', // cyan-400
          grid: '#334155', // slate-700
          tick: '#94a3b8', // slate-400
          tooltipBg: 'rgba(30, 41, 59, 0.8)',
      }
  };

  const colors = theme === 'dark' ? themeColors.dark : themeColors.light;
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={equityData}
        margin={{
          top: 5,
          right: 20,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis
          dataKey="tradeNumber"
          stroke={colors.tick}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Number of Trades', position: 'insideBottom', offset: -5, fill: colors.tick, fontSize: 12 }}
        />
        <YAxis
          stroke={colors.tick}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Equity (R)', angle: -90, position: 'insideLeft', offset: 10, fill: colors.tick, fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{fontSize: "12px"}} />
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