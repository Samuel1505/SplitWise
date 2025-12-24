'use client';

import { useAppKit } from '@reown/appkit/react';

export default function Hero() {
  const { open } = useAppKit();

  const pages = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Groups', icon: '👥' },
    { name: 'Expenses', icon: '💰' },
    { name: 'Settlements', icon: '✅' },
  ];

  return (
    <section className="container mx-auto px-6 py-20 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ✨ Decentralized • Multi-Token • Cross-Chain
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-zinc-900 dark:text-white leading-tight">
          Split Expenses
          <br />
          <span className="text-blue-600 dark:text-blue-400">
            The Smart Way
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          Track and settle shared expenses with friends using blockchain technology. 
          Support for multiple tokens and seamless cross-chain payments.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={() => open()}
            className="px-8 py-4 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
          <button className="px-8 py-4 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-semibold text-lg hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
            Learn More
          </button>
        </div>

        {/* Pages Showcase */}
        <div className="mt-16">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-6 uppercase tracking-wider">
            Explore Features
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {pages.map((page, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-blue-500 transition-all hover:shadow-lg cursor-pointer group"
              >
                <div className="text-3xl mb-3">{page.icon}</div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {page.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}