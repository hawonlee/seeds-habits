"use client";
import * as React from "react";
import { cn } from "@/lib/utils";


interface ProgressCircleProps {
 value: number;        // 0..100
 size?: number;        // px
 strokeWidth?: number; // px
 color?: string;       // progress arc color
 trackColor?: string;  // background ring color
 label?: React.ReactNode;
 className?: string;
 labelClassName?: string;
}


export const ProgressCircle: React.FC<ProgressCircleProps> = ({
 value,
 size = 40,
 strokeWidth = 8,
 color = "#111827",
 trackColor = "#FFFFFF",
 label,
 className,
 labelClassName,
}) => {
 const clamped = Math.max(0, Math.min(100, value || 0));
 const radius = size / 2 - strokeWidth / 2;
 const circumference = 2 * Math.PI * radius;
 const offset = circumference * (1 - clamped / 100);


 return (
   <div className="relative" style={{ width: size, height: size }}>
     <svg
       width={size}
       height={size}
       style={{ transform: "rotate(-90deg)" }}
       className={cn("relative", className)}
     >
       {/* Track ring */}
       <circle
         r={radius}
         cx={size / 2}
         cy={size / 2}
         fill="transparent"
         stroke={trackColor}
         strokeWidth={strokeWidth}
       />
       {/* Progress arc */}
       <circle
         r={radius}
         cx={size / 2}
         cy={size / 2}
         fill="transparent"
         stroke={color}
         strokeWidth={strokeWidth}
         strokeLinecap="round"
         strokeDasharray={circumference}
         strokeDashoffset={offset}
         style={{ transition: "stroke-dashoffset 0.35s" }}
       />
     </svg>


     {/* Optional label */}
     {label && (
       <div
         className={cn(
           "absolute inset-0 flex items-center justify-center text-[8px] text-muted-foreground",
           labelClassName
         )}
       >
         {label}
       </div>
     )}
   </div>
 );
};


export default ProgressCircle;


