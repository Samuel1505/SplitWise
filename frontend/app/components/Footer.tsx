export default function Footer() {
  return (
    <footer className="container mx-auto px-6 py-12 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">$</span>
            </div>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">SplitWise</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © 2024 SplitWise. Built on blockchain for transparency and security.
          </p>
        </div>
      </div>
    </footer>
  );
}

