import React from "react";

const LoadingCardsStats = () => {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 h-full border border-[#E5E5EA] dark:border-[#38383A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      <div className="flex justify-between items-center mb-5">
        <div className="h-5 w-24 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse"></div>
        <div className="h-10 w-10 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] animate-pulse"></div>
      </div>
      <div className="h-9 w-28 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse mt-4"></div>
      <div className="h-4 w-40 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-md animate-pulse mt-3"></div>
    </div>
  );
};

export default LoadingCardsStats;
