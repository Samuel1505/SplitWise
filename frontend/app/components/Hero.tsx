'use client';

import { useAppKit } from '@reown/appkit/react';

export default function Hero() {
  const { open } = useAppKit();

  return (
    <section className="container mx-auto px-6 py-20 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            ✨ Decentralized • Multi-Token • Cross-Chain
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
          Split Expenses
          <br />
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            The Smart Way
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          Track and settle shared expenses with friends using blockchain technology. 
          Support for multiple tokens and seamless cross-chain payments.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => open()}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
          >
            Get Started
          </button>
          <button className="px-8 py-4 rounded-full border-2 border-zinc-300 dark:border-zinc-700 text-foreground font-semibold text-lg hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}

