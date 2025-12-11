"use client";

export const StatsCard = ({
  icon,
  label,
  value,
  color = "gold",
  isLoading = false,
}: {
  icon: string;
  label: string;
  value: string | number;
  color?: "gold" | "green" | "blue";
  isLoading?: boolean;
}) => {
  const colorClasses = {
    gold: "from-solar-gold/20 to-solar-gold/5 border-solar-gold/30 text-solar-gold",
    green: "from-solar-green/20 to-solar-green/5 border-solar-green/30 text-solar-green",
    blue: "from-solar-blue/20 to-solar-blue/5 border-solar-blue/30 text-solar-blue",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border-2 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105`}
    >
      <div className="relative z-10">
        <div className="text-4xl mb-3">{icon}</div>
        <div className="space-y-2">
          {isLoading ? (
            <div className="h-10 bg-white/50 rounded animate-pulse"></div>
          ) : (
            <p className={`text-4xl font-bold ${colorClasses[color].split(" ")[4]}`}>
              {value}
            </p>
          )}
          <p className="text-gray-600 font-medium">{label}</p>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
    </div>
  );
};

