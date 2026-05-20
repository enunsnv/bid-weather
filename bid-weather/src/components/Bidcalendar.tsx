"use client";

import React, { useMemo } from "react";
import { usePredictionCalendar } from "@/hooks/useApi";
import { usePredictionSse } from "@/hooks/useSse";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function makeGetIntensity(maxCount: number) {
  return (count: number | undefined): 0 | 1 | 2 | 3 | 4 => {
    if (!count) return 0;
    if (maxCount <= 0) return 0;
    const ratio = count / maxCount;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  };
}

const intensityClasses = {
  0: "bg-transparent text-gray-400",
  1: "bg-blue-100 text-blue-700",
  2: "bg-blue-300 text-blue-900",
  3: "bg-blue-500 text-white",
  4: "bg-blue-700 text-white",
};

function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface Props {
  categoryId?: string;
  subcategoryId?: string;
}

export default function BidCalendar({ categoryId, subcategoryId }: Props) {
  usePredictionSse(categoryId, subcategoryId);
  const { data, isLoading } = usePredictionCalendar(categoryId, subcategoryId);

  const predictions = useMemo(() => data?.predictions ?? [], [data]);

  const today = new Date();

  const bidCounts = Object.fromEntries(
    predictions.map((item) => [item.date, item.count]),
  );

  const maxCount = predictions.reduce(
    (max, item) => (item.count > max ? item.count : max),
    0,
  );

  const getIntensity = makeGetIntensity(maxCount);

  const { weeks, firstDate, lastDate, isEmpty } = useMemo(() => {
    if (predictions.length === 0) {
      return {
        weeks: [] as { date: Date; inRange: boolean }[][],
        firstDate: null as Date | null,
        lastDate: null as Date | null,
        isEmpty: true,
      };
    }

    const sorted = [...predictions].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const first = startOfDay(new Date(sorted[0].date));
    const last = startOfDay(new Date(sorted[sorted.length - 1].date));

    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(last);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const cells: { date: Date; inRange: boolean }[] = [];
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const cur = new Date(d);
      cells.push({
        date: cur,
        inRange: cur >= first && cur <= last,
      });
    }

    const result: { date: Date; inRange: boolean }[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }

    return { weeks: result, firstDate: first, lastDate: last, isEmpty: false };
  }, [predictions]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 min-h-[400px] flex items-center justify-center">
        <span className="text-gray-400 text-sm">불러오는 중...</span>
      </div>
    );
  }

  const isCompact = weeks.length >= 6;

  const headerLabel =
    firstDate && lastDate
      ? firstDate.getFullYear() === lastDate.getFullYear() &&
        firstDate.getMonth() === lastDate.getMonth()
        ? `${firstDate.getFullYear()}년 ${firstDate.getMonth() + 1}월`
        : `${firstDate.getFullYear()}년 ${firstDate.getMonth() + 1}월 ${firstDate.getDate()}일 ~ ${
            firstDate.getFullYear() !== lastDate.getFullYear()
              ? `${lastDate.getFullYear()}년 `
              : ""
          }${lastDate.getMonth() + 1}월 ${lastDate.getDate()}일`
      : `${today.getFullYear()}년 ${today.getMonth() + 1}월`;

  return (
    <div className="bg-white rounded-2xl p-5 min-h-[400px] flex flex-col relative">
      {/* Header */}
      <div className="flex items-center mb-2">
        <span className="text-[14px] font-semibold text-gray-700">
          {headerLabel}
        </span>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[11px] text-gray-400 py-[2px]"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex flex-col gap-y-0.5 flex-1">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7">
            {week.map((cell, idx) => {
              const y = cell.date.getFullYear();
              const m = cell.date.getMonth();
              const d = cell.date.getDate();
              const key = toKey(y, m, d);
              const count = cell.inRange ? bidCounts[key] : undefined;
              const intensity = cell.inRange ? getIntensity(count) : 0;

              const isToday =
                cell.inRange &&
                d === today.getDate() &&
                m === today.getMonth() &&
                y === today.getFullYear();

              const showMonthLabel = d === 1 || (wIdx === 0 && idx === 0);

              return (
                <div key={idx} className="flex flex-col items-center py-[1px]">
                  {/* 날짜 */}
                  <span
                    className={`text-[11px] mb-[2px] ${
                      cell.inRange ? "text-gray-500" : "text-gray-300"
                    }`}
                  >
                    {showMonthLabel ? `${m + 1}/${d}` : d}
                  </span>

                  {/* Count */}
                  {cell.inRange && count ? (
                    <div
                      className={`
                        ${
                          isCompact
                            ? "w-6 h-6 text-[10px]"
                            : "w-8 h-8 text-[11px]"
                        }
                        rounded-full flex items-center justify-center
                        font-semibold transition-all
                        ${intensityClasses[intensity]}
                        ${isToday ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                      `}
                    >
                      {count}
                    </div>
                  ) : (
                    <div
                      className={`
                        ${isCompact ? "w-6 h-6" : "w-8 h-8"}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {isEmpty && (
        <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
          <span className="text-gray-400 text-sm">예측 대기 중</span>
        </div>
      )}
    </div>
  );
}
