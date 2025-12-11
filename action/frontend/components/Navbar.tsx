"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const Navbar = ({
  isConnected,
  account,
  chainId,
  onConnect,
}: {
  isConnected: boolean;
  account?: string;
  chainId?: number;
  onConnect: () => void;
}) => {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Log Usage", path: "/log" },
    { name: "My Profile", path: "/profile" },
    { name: "Leaderboard", path: "/leaderboard" },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b-2 border-solar-gold/20 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="text-5xl group-hover:scale-110 transition-transform animate-solar-pulse">
              ☀️
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-solar-gold via-solar-green to-solar-blue bg-clip-text text-transparent">
                SolarTrackChain
              </h1>
              <p className="text-xs text-gray-500">Powered by FHEVM</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  pathname === item.path
                    ? "bg-solar-gold text-white shadow-md"
                    : "text-gray-700 hover:bg-solar-gold/10"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3 bg-solar-green/10 px-4 py-2 rounded-lg border-2 border-solar-green/30">
                <div className="w-3 h-3 bg-solar-green rounded-full animate-pulse"></div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-700">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-500">Chain: {chainId}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="px-6 py-3 bg-gradient-to-r from-solar-gold to-solar-green text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 flex space-x-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                pathname === item.path
                  ? "bg-solar-gold text-white"
                  : "text-gray-700 hover:bg-solar-gold/10"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

