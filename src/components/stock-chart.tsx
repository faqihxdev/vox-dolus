import { stockPriceHistoryAtom } from '@/stores';
import { useAtom } from 'jotai';
import { ColorType, createChart, UTCTimestamp } from 'lightweight-charts';
import { useEffect, useMemo, useRef } from 'react';

interface StockChartProps {
  currentPrice: number;
}

export function StockChart({ currentPrice }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const [priceHistory, setPriceHistory] = useAtom(stockPriceHistoryAtom);

  // Add new price point to history
  useEffect(() => {
    setPriceHistory((prev) => {
      const now = Date.now();
      const candleInterval = 2000; // 2 seconds in milliseconds

      // If there's no previous data or it's been more than 2 seconds since last candle
      if (prev.length === 0 || now - prev[prev.length - 1].timestamp >= candleInterval) {
        // Create a new candle
        return [
          ...prev,
          {
            timestamp: now,
            price: currentPrice,
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice,
          },
        ].slice(-30); // Keep only last 30 candles
      }

      // Update the current candle
      const updatedHistory = [...prev];
      const currentCandle = updatedHistory[updatedHistory.length - 1];
      updatedHistory[updatedHistory.length - 1] = {
        ...currentCandle,
        price: currentPrice,
        high: Math.max(currentCandle.high, currentPrice),
        low: Math.min(currentCandle.low, currentPrice),
        close: currentPrice,
      };

      return updatedHistory;
    });
  }, [currentPrice, setPriceHistory]);

  // Memoize the candlestick data
  const candleData = useMemo(() => {
    return priceHistory.map((p) => ({
      time: (p.timestamp / 1000) as UTCTimestamp,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));
  }, [priceHistory]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 200,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
    });

    // Create series
    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Store chart instance
    chartRef.current = chart;

    // Set initial data
    series.setData(candleData);
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candleData]); // Recreate chart when data changes

  // Update data
  useEffect(() => {
    if (!chartRef.current) return;

    const series = chartRef.current.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    series.setData(candleData);
    chartRef.current.timeScale().fitContent();
  }, [candleData]);

  return (
    <div className='w-full bg-background/80 backdrop-blur-sm rounded-lg p-4 shadow-lg'>
      <div ref={chartContainerRef} />
    </div>
  );
}
