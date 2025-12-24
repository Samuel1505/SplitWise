'use client';

import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export default function CTA() {
  const { isConnected } = useAccount();
  const { open } = useAppKit();

  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl bg-blue-600 p-12 md:p-16 text-center border-2 border-blue-700">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to split expenses the smart way?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect your wallet and start creating groups, adding expenses, and settling payments on the blockchain.
          </p>
          <button
            onClick={() => open()}
            className="px-10 py-4 rounded-lg bg-white text-blue-600 font-semibold text-lg hover:bg-zinc-100 transition-all shadow-xl hover:shadow-2xl"
          >
            {isConnected ? 'Get Started' : 'Connect Wallet & Get Started'}
          </button>
        </div>
      </div>
    </section>
  );
}

