'use client';

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { baseSepolia } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { useState } from 'react';

// Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'YOUR_PROJECT_ID';

// Create wagmiAdapter with Base Sepolia testnet
const wagmiAdapter = new WagmiAdapter({
  networks: [baseSepolia],
  projectId,
});

const wagmiConfig = wagmiAdapter.wagmiConfig;

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [baseSepolia],
  projectId,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'github', 'apple', 'x', 'discord'],
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#6366f1',
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

