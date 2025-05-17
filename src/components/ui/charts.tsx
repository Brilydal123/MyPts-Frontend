"use client";

import { BarChart as TremorBarChart } from "@tremor/react";
import { LineChart as TremorLineChart } from "@tremor/react";
import { DonutChart } from "@tremor/react";

interface ChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors: string[];
  valueFormatter?: (value: number) => string;
  yAxisWidth?: number;
}

interface PieChartProps {
  data: any[];
  index: string;
  valueKey: string;
  category: string;
  colors: string[];
}

export function BarChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  yAxisWidth = 56,
}: ChartProps) {
  return (
    <TremorBarChart
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter}
      yAxisWidth={yAxisWidth}
      showLegend={false}
      showAnimation={true}
      className="h-full"
    />
  );
}

export function LineChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => `${value}`,
  yAxisWidth = 56,
}: ChartProps) {
  return (
    <TremorLineChart
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter}
      yAxisWidth={yAxisWidth}
      showLegend={false}
      showAnimation={true}
      className="h-full"
    />
  );
}

export function PieChart({
  data,
  index,
  valueKey,
  category,
  colors,
}: PieChartProps) {
  return (
    <DonutChart
      data={data}
      index={index}
      valueFormatter={(value: { toLocaleString: () => any; }) => `${value.toLocaleString()} MyPts`}
      category={valueKey}
      colors={colors}
      showAnimation={true}
      className="h-full"
    />
  );
}
