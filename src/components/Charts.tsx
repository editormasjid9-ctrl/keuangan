import React, { useState } from 'react';
import { formatMillions, formatPercent, formatRupiah } from '../utils/formatters';

interface SparklineProps {
  points: number[];
  strokeColor: string;
  fillColor: string;
  id: string;
}

export function KpiSparkline({ points, strokeColor, fillColor, id }: SparklineProps) {
  const width = 120;
  const height = 42;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((p, idx) => {
    const x = (idx / Math.max(points.length - 1, 1)) * width;
    const y = height - 6 - ((p - min) / range) * (height - 14);
    return { x, y };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-28 h-10 shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${id})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface MonthlyBarItem {
  monthKey: string;
  label: string;
  fullLabel: string;
  target: number;
  realized: number;
}

interface IncomeTargetBarChartProps {
  data: MonthlyBarItem[];
  selectedMonthKey: string;
  onSelectMonth?: (monthKey: string) => void;
}

export function IncomeTargetBarChart({
  data,
  selectedMonthKey,
  onSelectMonth,
}: IncomeTargetBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartHeight = 186;
  const chartWidth = 370;
  const padLeft = 38;
  const padRight = 10;
  const padTop = 14;
  const padBottom = 26;
  const innerHeight = chartHeight - padTop - padBottom;
  const innerWidth = chartWidth - padLeft - padRight;

  const maxVal = Math.max(
    15_000_000,
    ...data.flatMap((d) => [d.target, d.realized])
  );
  const yMax = Math.ceil(maxVal / 5_000_000) * 5_000_000;
  const ticks = [0, yMax / 3, (2 * yMax) / 3, yMax];

  const groupWidth = innerWidth / data.length;
  const barWidth = Math.min(16, groupWidth * 0.28);
  const gapBetweenBars = 3;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Grafik perbandingan target dan realisasi pemasukan bulanan"
      >
        {/* Y-axis gridlines & labels */}
        {ticks.map((tick, idx) => {
          const y = padTop + innerHeight - (tick / yMax) * innerHeight;
          return (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={y}
                x2={chartWidth - padRight}
                y2={y}
                stroke={tick === 0 ? '#CBD5E1' : '#E5EDE8'}
                strokeWidth="1"
              />
              <text
                x={padLeft - 7}
                y={y + 4}
                textAnchor="end"
                className="fill-[#5D7366] text-[10px] font-medium tabular-nums"
              >
                {`${Math.round(tick / 1_000_000)} jt`}
              </text>
            </g>
          );
        })}

        {/* Grouped Bars */}
        {data.map((d, idx) => {
          const cx = padLeft + idx * groupWidth + groupWidth / 2;
          const targetH = Math.max(2, (d.target / yMax) * innerHeight);
          const realizedH = Math.max(2, (d.realized / yMax) * innerHeight);
          const targetY = padTop + innerHeight - targetH;
          const realizedY = padTop + innerHeight - realizedH;
          const isSelected = d.monthKey === selectedMonthKey;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={d.monthKey}
              className={onSelectMonth ? 'cursor-pointer' : ''}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelectMonth?.(d.monthKey)}
            >
              {/* Subtle highlight column */}
              {(isSelected || isHovered) && (
                <rect
                  x={cx - groupWidth * 0.42}
                  y={padTop - 4}
                  width={groupWidth * 0.84}
                  height={innerHeight + 6}
                  rx="6"
                  fill="#0E6B43"
                  opacity={isHovered ? 0.08 : 0.05}
                />
              )}

              {/* Target Bar */}
              <rect
                x={cx - barWidth - gapBetweenBars / 2}
                y={targetY}
                width={barWidth}
                height={targetH}
                rx="3"
                fill="#B8C8C2"
                className="transition-opacity duration-150"
                opacity={hoveredIdx !== null && !isHovered ? 0.72 : 1}
              />

              {/* Realized Bar */}
              <rect
                x={cx + gapBetweenBars / 2}
                y={realizedY}
                width={barWidth}
                height={realizedH}
                rx="3"
                fill={isSelected ? '#0B5E3A' : '#127A4D'}
                className="transition-opacity duration-150"
                opacity={hoveredIdx !== null && !isHovered ? 0.72 : 1}
              />

              {/* Month Label */}
              <text
                x={cx}
                y={chartHeight - 7}
                textAnchor="middle"
                className={`text-[11px] ${
                  isSelected
                    ? 'fill-[#0B4D32] font-bold'
                    : 'fill-[#4C6457] font-medium'
                }`}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="pointer-events-none absolute top-0 right-1 z-10 rounded-lg border border-[#D4E2DA] bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm text-xs">
          <p className="font-semibold text-[#0F2E1F] mb-1">
            {data[hoveredIdx].fullLabel}
          </p>
          <div className="flex items-center justify-between gap-4 text-[#5D7366]">
            <span>Target:</span>
            <span className="font-mono font-semibold tabular-nums text-[#334155]">
              {formatMillions(data[hoveredIdx].target)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#0E6B43]">
            <span>Realisasi:</span>
            <span className="font-mono font-semibold tabular-nums">
              {formatRupiah(data[hoveredIdx].realized)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  total: number;
  size?: number;
}

export function DonutChart({ slices, total, size = 166 }: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const radius = 56;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativeOffset = 0;
  const safeTotal = total > 0 ? total : 1;

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        role="img"
        aria-label="Grafik proporsi donat"
      >
        {/* Background track when empty */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#EDF3EF"
          strokeWidth={strokeWidth}
        />

        {total > 0 &&
          slices.map((slice, idx) => {
            const fraction = slice.value / safeTotal;
            const dashLength = fraction * circumference;
            const dashOffset = -cumulativeOffset;
            cumulativeOffset += dashLength;
            const isHovered = hoveredIndex === idx;

            return (
              <circle
                key={slice.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${center} ${center})`}
                className="transition-all duration-150 cursor-pointer"
                opacity={hoveredIndex !== null && !isHovered ? 0.55 : 1}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

        {/* Inner white circle label */}
        <text
          x={center}
          y={center - 3}
          textAnchor="middle"
          className="fill-[#0F2E1F] text-[12px] font-bold tabular-nums"
        >
          {activeSlice ? formatRupiah(activeSlice.value) : formatRupiah(total)}
        </text>
        <text
          x={center}
          y={center + 13}
          textAnchor="middle"
          className="fill-[#5D7366] text-[10.5px] font-medium"
        >
          {activeSlice
            ? `${activeSlice.label} (${formatPercent((activeSlice.value / safeTotal) * 100)})`
            : 'Total'}
        </text>
      </svg>
    </div>
  );
}
