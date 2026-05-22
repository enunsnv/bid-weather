"use client";
import React, { useEffect, useState } from "react";
import WeatherCard from "./WeatherCard";

interface MappedWeather {
  date: string;
  condition: string;
  max: number;
  min: number;
}

export default function WeeklyWeather() {
  const [weeklyWeather, setWeeklyWeather] = useState<MappedWeather[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/v1/weather");
        const data = await res.json();

        const today = new Date();
        const mappedData: MappedWeather[] = [7, 6, 5, 4, 3, 2, 1].map((num) => {
          const key = `${num}ago`;
          const rawData = data[key];
          const dayData = Array.isArray(rawData) ? rawData[0] : rawData;
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() - num);

          return {
            date: targetDate.getDate().toString(),
            condition: dayData?.weatherType || "SUNNY",
            max: parseInt(dayData?.maxTemp || "0", 10),
            min: parseInt(dayData?.minTemp || "0", 10),
          };
        });

        setWeeklyWeather(mappedData);
      } catch (error) {
        console.error("날씨 정보 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (!isMounted) {
    return null;
  }

  if (isLoading)
    return (
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mt-4">
        {Array.from({ length: 7 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center justify-between p-4 bg-white rounded-xl h-[148px] animate-pulse"
          >
            <div className="h-5 w-8 bg-gray-200 rounded mb-1"></div>
            <div className="w-14 h-14 bg-gray-200 rounded-full my-1"></div>
            <div className="h-4 w-12 bg-gray-200 rounded mt-2"></div>
          </div>
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mt-4">
      {weeklyWeather.map((weather, idx) => (
        <WeatherCard
          key={idx}
          date={weather.date}
          condition={weather.condition}
          maxTemp={weather.max}
          minTemp={weather.min}
        />
      ))}
    </div>
  );
}
