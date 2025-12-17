This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Set Up Environment Variables

Create a `.env.local` file in the frontend directory and add your Reown AppKit Project ID:

```bash
NEXT_PUBLIC_PROJECT_ID=your_project_id_here
```

To get your Project ID:
1. Go to [Reown Cloud Dashboard](https://cloud.reown.com)
2. Sign in or create an account
3. Create a new project
4. Copy your Project ID and add it to `.env.local`

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Connect Your Wallet

The app is configured to connect to **Base Sepolia Testnet**. Click the "Connect Wallet" button to connect using Reown AppKit (WalletConnect).

## Features

- **Wallet Connection**: Connect using Reown AppKit with support for multiple wallet providers
- **Base Sepolia Testnet**: Configured to work with Base Sepolia testnet
- **Modern UI**: Built with Next.js, React, and Tailwind CSS

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
