import * as React from "react";
import { ChartContainer } from "@/components/ui/chart";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface ProgressCircleProps {
  value: number; // 0..100
  size?: number; // px
  strokeWidth?: number; // px
  color?: string;
  trackColor?: string;
  label?: React.ReactNode;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 48,
  strokeWidth = 8,
  color = '#111827',
  trackColor = '#E5E7EB',
  label,
}) => {
  const clamped = Math.max(0, Math.min(100, value || 0));
  const data = React.useMemo(() => [{ name: 'progress', value: clamped, fill: color }], [clamped, color]);
  const outerRadius = Math.max(0, size / 2 - 2);
  const innerRadius = Math.max(0, outerRadius - strokeWidth);

  return (
    <div style={{ width: size, height: size }} className="relative">
      <ChartContainer config={{}} className="w-full h-full">
        <RadialBarChart data={data} startAngle={90} endAngle={-270} innerRadius={innerRadius} outerRadius={outerRadius} cy="50%" cx="50%">
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
          <RadialBar dataKey="value" background={{ fill: trackColor }} cornerRadius={strokeWidth / 2} />
        </RadialBarChart>
      </ChartContainer>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center text-[8px] text-muted-foreground">
          {label}
        </div>
      )}
    </div>
  );
};

export default ProgressCircle;


