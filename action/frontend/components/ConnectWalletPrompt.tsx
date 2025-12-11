"use client";

export const ConnectWalletPrompt = ({ onConnect }: { onConnect: () => void }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center max-w-2xl mx-auto space-y-8">
        {/* Animated Sun */}
        <div className="relative inline-block">
          <div className="text-9xl animate-solar-pulse">☀️</div>
          <div className="absolute inset-0 bg-solar-gold/20 rounded-full blur-3xl animate-glow -z-10"></div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-solar-gold via-solar-green to-solar-blue bg-clip-text text-transparent">
            Welcome to SolarTrackChain
          </h1>
          <p className="text-2xl text-gray-600">
            Track your solar energy usage on-chain
          </p>
          <p className="text-lg text-gray-500">
            Powered by FHEVM - Privacy-preserving blockchain technology
          </p>
        </div>

        {/* Connect Button */}
        <button
          onClick={onConnect}
          className="group relative px-12 py-6 bg-gradient-to-r from-solar-gold via-solar-green to-solar-blue text-white rounded-2xl font-bold text-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center space-x-3">
            <span>🔗</span>
            <span>Connect Wallet</span>
          </span>
          <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </button>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-solar-gold/30 hover:shadow-xl transition-all">
            <div className="text-5xl mb-3">🔐</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Privacy First
            </h3>
            <p className="text-gray-600 text-sm">
              Your data is encrypted using advanced FHEVM technology
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-solar-green/30 hover:shadow-xl transition-all">
            <div className="text-5xl mb-3">⛓️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Immutable Records
            </h3>
            <p className="text-gray-600 text-sm">
              Your contributions are permanently recorded on blockchain
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-solar-blue/30 hover:shadow-xl transition-all">
            <div className="text-5xl mb-3">🌍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Global Impact
            </h3>
            <p className="text-gray-600 text-sm">
              Join a community making a difference for our planet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

