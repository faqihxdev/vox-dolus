import { stockPriceHistoryAtom } from '@/stores';
import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface StockChartProps {
  initialPrice: number;
  currentPrice: number;
}

export function StockChart({ initialPrice, currentPrice }: StockChartProps) {
  const [priceHistory, setPriceHistory] = useAtom(stockPriceHistoryAtom);

  // Add new price point to history
  useEffect(() => {
    setPriceHistory((prev) => {
      // Keep only last 30 points
      const newHistory = [...prev, { timestamp: Date.now(), price: currentPrice }];
      if (newHistory.length > 30) {
        return newHistory.slice(-30);
      }
      return newHistory;
    });
  }, [currentPrice, setPriceHistory]);

  // Calculate min and max for y-axis
  const { minPrice, maxPrice } = useMemo(() => {
    if (priceHistory.length === 0) {
      return {
        minPrice: Math.min(initialPrice, currentPrice) * 0.9,
        maxPrice: Math.max(initialPrice, currentPrice) * 1.1,
      };
    }

    const prices = priceHistory.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;

    return {
      minPrice: min - padding,
      maxPrice: max + padding,
    };
  }, [priceHistory, initialPrice, currentPrice]);

  // Format timestamp for x-axis
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Format price for tooltip
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Calculate stroke color based on price trend
  const strokeColor = currentPrice >= initialPrice ? '#22c55e' : '#ef4444';

  return (
    <div className='w-full h-48 bg-background/80 backdrop-blur-sm rounded-lg p-4 shadow-lg'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={priceHistory}>
          <defs>
            <linearGradient id='colorPrice' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset='95%' stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray='3 3' opacity={0.2} />
          <XAxis
            dataKey='timestamp'
            tickFormatter={formatTime}
            interval='preserveStartEnd'
            minTickGap={50}
          />
          <YAxis domain={[minPrice, maxPrice]} tickFormatter={formatPrice} width={80} />
          <Tooltip
            formatter={formatPrice}
            labelFormatter={formatTime}
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
            }}
          />
          <Area
            type='monotone'
            dataKey='price'
            stroke={strokeColor}
            fillOpacity={1}
            fill='url(#colorPrice)'
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
