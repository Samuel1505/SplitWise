export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-black dark:via-zinc-950 dark:to-zinc-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">$</span>
            </div>
            <span className="text-2xl font-bold text-foreground">SplitWise</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              How it works
            </button>
            <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl">
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
            <button className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform">
              Get Started
            </button>
            <button className="px-8 py-4 rounded-full border-2 border-zinc-300 dark:border-zinc-700 text-foreground font-semibold text-lg hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            Why SplitWise?
          </h2>
          <p className="text-center text-zinc-600 dark:text-zinc-400 mb-16 text-lg">
            Built on blockchain for transparency, security, and flexibility
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Group Management</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Create expense groups with friends and family. Add members easily and track all expenses in one place.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Multi-Token Support</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Split expenses using ETH or any ERC20 token. Perfect for diverse crypto portfolios and international groups.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Cross-Chain Payments</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Settle payments using different tokens with automatic conversion. Ideal for cross-chain scenarios.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Transparent & Secure</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                All transactions are recorded on-chain. View balances, expenses, and payment history with complete transparency.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Smart Balance Tracking</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Automatic balance calculation. See who owes what across all groups and tokens in real-time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Instant Settlements</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Settle payments instantly with one click. Support for same-token and cross-token settlements with conversion rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to split expenses the smart way?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Connect your wallet and start creating groups, adding expenses, and settling payments on the blockchain.
            </p>
            <button className="px-10 py-4 rounded-full bg-white text-blue-600 font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform">
              Connect Wallet & Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">$</span>
              </div>
              <span className="text-lg font-bold text-foreground">SplitWise</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              © 2024 SplitWise. Built on blockchain for transparency and security.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
