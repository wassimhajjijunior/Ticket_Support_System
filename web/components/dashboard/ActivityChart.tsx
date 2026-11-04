"use client";

import { useEffect, useRef, useState } from "react";

import { Card, SectionHeader } from "@/components/ui/kit";
import { shortDate, weekdayShort } from "@/lib/format";
import type { DayStat } from "@/lib/types";

const HEIGHT = 190;
const PAD = { top: 14, right: 8, bottom: 26, left: 28 };

function niceMax(value: number): number {
  if (value <= 4) return 4;
  if (value <= 10) return Math.ceil(value / 2) * 2;
  return Math.ceil(value / 10) * 10;
}

function useContainerWidth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      if (next > 0) setWidth(Math.max(280, Math.floor(next)));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { containerRef, width };
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] font-medium text-faint">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
        Created
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2 rounded-full bg-teal" />
        Closed
      </span>
    </div>
  );
}

export function ActivityChart({ days }: { days: DayStat[] }) {
  const { containerRef, width } = useContainerWidth();
  const data = days.slice(-7);

  const maxValue = Math.max(
    1,
    ...data.flatMap((day) => [day.created, day.closed])
  );
  const max = niceMax(maxValue);

  const plotWidth = Math.max(10, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const groupWidth = plotWidth / Math.max(1, data.length);
  const barWidth = Math.min(14, Math.max(6, groupWidth * 0.24));
  const barGap = Math.max(2, Math.min(4, groupWidth * 0.07));

  const totalCreated = data.reduce((sum, day) => sum + day.created, 0);
  const totalClosed = data.reduce((sum, day) => sum + day.closed, 0);
  const summary = `Ticket activity for the last ${data.length} days: ${totalCreated} created and ${totalClosed} closed.`;
  const empty = data.every((day) => day.created === 0 && day.closed === 0);

  return (
    <Card className="animate-rise p-5 sm:p-6" style={{ animationDelay: "140ms" }}>
      <SectionHeader
        title="Activity"
        description={`${totalCreated} created · ${totalClosed} closed in the last 7 days`}
        action={<Legend />}
      />

      <div ref={containerRef} className="mt-4 w-full">
        <svg
          role="img"
          aria-label={summary}
          width="100%"
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="overflow-visible"
        >
          <title>{summary}</title>

          {[0, max / 2, max].map((tick) => {
            const y = PAD.top + plotHeight - (tick / max) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="#e9ecf3"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? undefined : "4 5"}
                />
                <text
                  x={PAD.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#8792a4"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {data.map((day, index) => {
            const groupX = PAD.left + index * groupWidth;
            const center = groupX + groupWidth / 2;
            const createdHeight = (day.created / max) * plotHeight;
            const closedHeight = (day.closed / max) * plotHeight;
            const createdX = center - barWidth - barGap / 2;
            const closedX = center + barGap / 2;
            const baseline = PAD.top + plotHeight;

            return (
              <g key={day.date}>
                <title>{`${shortDate(day.date)} · ${day.created} created, ${day.closed} closed`}</title>
                <rect
                  x={groupX + 1}
                  y={PAD.top}
                  width={Math.max(0, groupWidth - 2)}
                  height={plotHeight}
                  rx="6"
                  fill="transparent"
                  className="transition-colors duration-200 hover:fill-[#f1f3f7]"
                />
                {day.created > 0 ? (
                  <rect
                    x={createdX}
                    y={baseline - createdHeight}
                    width={barWidth}
                    height={createdHeight}
                    rx="3"
                    fill="#1b6be0"
                  />
                ) : null}
                {day.closed > 0 ? (
                  <rect
                    x={closedX}
                    y={baseline - closedHeight}
                    width={barWidth}
                    height={closedHeight}
                    rx="3"
                    fill="#22c7bc"
                  />
                ) : null}
                <text
                  x={center}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#8792a4"
                >
                  {weekdayShort(day.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {empty ? (
        <p className="mt-2 text-center text-[11px] text-faint">
          No activity in the last 7 days.
        </p>
      ) : null}

      <ul className="sr-only">
        {data.map((day) => (
          <li key={day.date}>
            {shortDate(day.date)}: {day.created} created, {day.closed} closed
          </li>
        ))}
      </ul>
    </Card>
  );
}
