import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import LoadingCardsStats from "../shared/loading-cards-stats";
import { Icons } from "../ui/icons";

interface LifeTimeStatsProps {
  balance: {
    lifetimeEarned: number;
    lifetimeSpent: number;
  };
  unit: string;
  subtitle: string;

  isLoading: boolean;
}
const LifeTimeStats = ({
  balance,
  unit,
  subtitle,
  isLoading,
}: LifeTimeStatsProps) => {
  if (isLoading) {
    return <LoadingCardsStats />;
  }

  return (
    <div className="rounded-shadow p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-[#86868b] dark:text-[#86868b]">
          Life Time
        </h3>
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            "bg-[#f5f5f7] dark:bg-[#2c2c2e]"
          )}
        >
          <div className={cn("h-5 w-5", "text-[#007AFF] dark:text-[#0A84FF]")}>
            <Icons.lifeTime />
          </div>
        </div>
      </div>

      <div className="mt-1">
        <div className="text-sm text-[#86868b] dark:text-[#86868b] mt-1 flex flex-col gap-2">
          <p className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="size-4" />{" "}
              <span className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                {balance.lifetimeEarned}
              </span>{" "}
              {unit}
            </span>
            <span className="text-xs text-[#86868b] dark:text-[#86868b]">
              Earned
            </span>
          </p>
          <p className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ArrowDownRight className="size-4" />{" "}
              <span className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                {balance.lifetimeSpent}
              </span>{" "}
              {unit}
            </span>
            <span className="text-xs text-[#86868b] dark:text-[#86868b]">
              Redeemed
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LifeTimeStats;
