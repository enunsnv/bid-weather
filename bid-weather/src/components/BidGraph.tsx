"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { usePredictionGraph } from "@/hooks/useApi";

interface ApiDataPoint {
  period: string;
  actualCount: number | null;
  predictCount: number | null;
  partialActual?: number;
}

interface BidGraphProps {
  categoryId: string;
  subcategoryId: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const filteredPayload =
      payload.length > 1
        ? payload.filter((p: any) => p.dataKey === "predictCount")
        : payload;

    return (
      <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
        <p className="text-gray-700 font-bold mb-2">{label}</p>
        {filteredPayload.map((entry: any, index: number) => (
          <div key={index} className="mb-1 last:mb-0">
            <p className="text-sm m-0" style={{ color: entry.color }}>
              {entry.dataKey === "actualCount" ? "실제 데이터" : "예측 데이터"}{" "}
              : {entry.value.toLocaleString()} 건
            </p>
            {entry.payload.partialActual !== undefined &&
              entry.dataKey === "predictCount" && (
                <p className="text-xs text-gray-500 mt-1 m-0">
                  (어제까지 집계: {entry.payload.partialActual.toLocaleString()}{" "}
                  건)
                </p>
              )}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function BidGraph({ categoryId, subcategoryId }: BidGraphProps) {
  const {
    data: rawData,
    isLoading,
    isError,
  } = usePredictionGraph(categoryId, subcategoryId);

  const { data, splitPoint } = useMemo(() => {
    if (!rawData || !rawData.graphData) return { data: [], splitPoint: null };

    const processedData: ApiDataPoint[] = rawData.graphData.map((d: any) => ({
      ...d,
    }));
    let splitPeriod: string | null = null;

    const currentIndex = processedData.findIndex(
      (d) => d.actualCount !== null && d.predictCount !== null,
    );

    if (currentIndex !== -1) {
      const currentItem = processedData[currentIndex];

      splitPeriod =
        currentIndex > 0
          ? processedData[currentIndex - 1].period
          : currentItem.period;

      const partialActual = currentItem.actualCount || 0;
      const partialPredict = currentItem.predictCount || 0;

      currentItem.predictCount = partialActual + partialPredict;
      currentItem.partialActual = partialActual;
      currentItem.actualCount = null;

      if (
        currentIndex > 0 &&
        processedData[currentIndex - 1].actualCount !== null
      ) {
        processedData[currentIndex - 1].predictCount =
          processedData[currentIndex - 1].actualCount;
      }
    }

    return { data: processedData, splitPoint: splitPeriod };
  }, [rawData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 h-[400px] w-full flex items-center justify-center text-gray-400">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  if (isError || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 h-[400px] w-full flex items-center justify-center text-gray-400">
        조회된 데이터가 없습니다.
      </div>
    );
  }

  const formatXAxis = (tickItem: any) => {
    if (!tickItem || typeof tickItem !== "string") return "";
    const parts = tickItem.split("-");
    if (parts.length < 2) return tickItem;
    return `${parseInt(parts[1], 10)}월`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 h-[400px] w-full">
      <ResponsiveContainer width="99%" height="100%" minWidth={0}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid stroke="#F3F4F6" vertical={false} />

          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            dy={10}
            tickFormatter={formatXAxis}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#9CA3AF" }}
            dx={-4}
            width={70}
            tickFormatter={(value) => value.toLocaleString()}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#f3f4f6", strokeWidth: 1 }}
          />

          {splitPoint && (
            <ReferenceLine
              x={splitPoint}
              stroke="#E5E7EB"
              strokeDasharray="3 3"
            />
          )}

          <Line
            type="linear"
            dataKey="actualCount"
            stroke="#4B5563"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, fill: "#4B5563", strokeWidth: 0 }}
            connectNulls={true}
          />

          <Line
            type="linear"
            dataKey="predictCount"
            stroke="#3B82F6"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
