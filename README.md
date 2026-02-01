# OracleLens

A credibility verification layer that evaluates oracle data before it reaches your smart contracts.

## Introduction

OracleLens is **NOT** an oracle — it sits **between** oracle data and on-chain decisions to verify data credibility.

**What it does:**
- Evaluates oracle data using the **S.T.A.P.** scoring system (Source, Time, Accuracy, Proof)
- Provides zkTLS verification via Primus Labs SDK for cryptographic data authenticity
- AI-powered formula selection for different data types
- On-chain submission of credibility scores

**Use cases:** Smart contracts, DAOs, prediction markets that need to verify oracle data before making critical decisions.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Backend API    │────▶│   On-Chain      │
│  (Next.js)  │     │   (Next.js API)  │     │   (Solidity)    │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                     │
       ▼                     ▼
┌─────────────┐     ┌──────────────────┐
│ Primus SDK  │     │   AI Formula     │
│   (zkTLS)   │     │   Selection      │
└─────────────┘     └──────────────────┘
```

**Tech Stack:**
- Frontend: Next.js 16, TypeScript, Tailwind CSS
- Verification: Primus Labs zkTLS SDK, AI-powered scoring
- On-Chain: Solidity, Foundry, Sepolia Testnet

## Build Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/baiqi-2019/OracleLens.git
cd OracleLens

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your API keys

# Run development server
cd apps/web
npm run dev
```

### Environment Variables

```env
# Primus Labs zkTLS
NEXT_PUBLIC_PRIMUS_APP_ID=your_app_id
NEXT_PUBLIC_PRIMUS_TEMPLATE_ID=your_template_id
PRIMUS_APP_ID=your_app_id
PRIMUS_APP_SECRET=your_app_secret

# AI (OpenRouter)
OPENROUTER_API_KEY=your_api_key
```

## Demo Videos and Links

**Live Demo:** [https://oraclelens-web.vercel.app/](https://oraclelens-web.vercel.app/)

**Demo Video:** [TODO: Add video link]

**GitHub:** [https://github.com/baiqi-2019/OracleLens](https://github.com/baiqi-2019/OracleLens)

## Contact

**Developer:** [baiqi-2019](https://github.com/baiqi-2019)

- Email: tdcq532787678@gmail.com
- X: [@andygrow2free](https://x.com/andygrow2free/)
- Telegram: [@zhmzwsovo](https://t.me/zhmzwsovo)
