export default function Navbar() {
  return (
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
  );
}

