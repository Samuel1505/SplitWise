'use client';

import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export default function CTA() {
  const { isConnected } = useAccount();
  const { open } = useAppKit();

  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-12 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to split expenses the smart way?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect your wallet and start creating groups, adding expenses, and settling payments on the blockchain.
          </p>
          <button
            onClick={() => open()}
            className="px-10 py-4 rounded-full bg-white text-blue-600 font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
          >
            {isConnected ? 'Get Started' : 'Connect Wallet & Get Started'}
          </button>
        </div>
      </div>
    </section>
  );
}

