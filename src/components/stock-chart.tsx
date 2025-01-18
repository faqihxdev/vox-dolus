
interface StockChartProps {
  data: Array<{
    timestamp: number;
    price: number;
  }>;
}

/**
 * @description Temporary simplified stock display component
 */
export function StockChart({ data }: StockChartProps) {
  const currentPrice = data[data.length - 1]?.price ?? 100;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold">
        ${currentPrice.toFixed(2)}
      </div>
      <div className="text-sm text-muted-foreground mt-2">
        Current Stock Price
      </div>
    </div>
  );
}
