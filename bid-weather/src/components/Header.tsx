"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function Header() {
  const [dateTimeStr, setDateTimeStr] = useState("");

  useEffect(() => {
    const format = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const weekday = now.toLocaleDateString("ko-KR", { weekday: "short" });
      const date = `${datePart} (${weekday})`;
      const time = now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setDateTimeStr(`${date} ${time}`);
    };

    format();
    const interval = setInterval(format, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="w-full px-12 py-5 flex items-center justify-between">
        <Image
          src="/logo.svg"
          alt="BidWeather 로고"
          width={60}
          height={60}
          priority
        />

        <span className="text-[14px] text-black font-medium tabular-nums">
          {dateTimeStr}
        </span>
      </div>
    </header>
  );
}
