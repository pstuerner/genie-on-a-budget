<p align="center">
  <img alt="Natural language SQL interface for PostgreSQL" src="public/images/genie.svg" width="100">
</p>

<h1 align="center">Genie on a Budget</h1>

<p align="center">
    An MVP replicating Databricks Genie's core functionality - natural language querying of PostgreSQL databases using AI. Built with Next.js and the AI SDK.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#demo-dataset"><strong>Demo Dataset</strong></a> ·
  <a href="#running-locally"><strong>Running Locally</strong></a> ·
  <a href="#running-with-docker"><strong>Running with Docker</strong></a> ·
  <a href="#environment-variables"><strong>Environment Setup</strong></a>
</p>
<br/>

## Overview

Genie on a Budget replicates Databricks' Genie agent functionality, providing an intuitive chat interface that translates natural language questions into SQL queries. Ask questions about your data in plain English, and the AI agent will query your database and present the results.

The MVP includes a pre-loaded Amazon product review dataset with 200K+ reviews from [Hugging Face](https://huggingface.co/datasets/minhth2nh/amazon_product_review_283K), allowing you to explore product reviews, ratings, and metadata through conversational queries.

## Features

- **Natural Language SQL**: Ask questions in plain English and get SQL queries automatically generated and executed
- **Chat Interface**: Conversational UI for exploring your database
- **Result Visualization**: View query results in formatted tables
- **Query Suggestions**: AI-powered suggestions based on your data schema
- **Authentication**: Secure guest and authenticated user sessions via Auth.js
- **Chat History**: Save and resume previous conversations
- **Modern Stack**:
  - [Next.js](https://nextjs.org) App Router with React Server Components
  - [AI SDK](https://ai-sdk.dev/docs/introduction) for LLM integration
  - [PostgreSQL](https://www.postgresql.org) for data storage
  - [Drizzle ORM](https://orm.drizzle.team) for type-safe database queries
  - [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
  - [Tailwind CSS](https://tailwindcss.com) for styling

## Demo Dataset

The MVP uses the [Amazon Product Review dataset](https://huggingface.co/datasets/minhth2nh/amazon_product_review_283K) containing 200K+ product reviews from Amazon Fashion. The dataset includes:

- Product reviews with ratings, text, and metadata
- Product information (titles, descriptions, features, prices)
- User engagement data (helpful votes, verified purchases)
- Product images and videos
- Timestamps and categories

Sample queries you can try:
- "What are the top 5 highest rated products?"
- "Show me all 1-star reviews from the past month"
- "Which products have the most verified purchases?"
- "What's the average rating for products with prices over $50?"

## Running Locally

### Prerequisites

- Node.js 18+ and pnpm installed
- PostgreSQL 15+ (or use Docker Compose)

### Quick Start

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd genie-on-a-budget
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory (see [Environment Variables](#environment-variables) below for details):

```bash
# Database
POSTGRES_URL=postgresql://genie-on-a-budget-user:genie-on-a-budget-pwd@localhost:5432/genie-on-a-budget

# Authentication
AUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

4. **Start PostgreSQL**

If you have Docker installed, the easiest way is:

```bash
docker-compose up postgres -d
```

Or use your local PostgreSQL installation.

5. **Run database migrations and import data**

```bash
pnpm db:migrate
pnpm db:import ./data/train-00000-of-00003.parquet
```

6. **Start the development server**

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Running with Docker

The simplest way to run the entire stack is with Docker Compose:

```bash
# Start both PostgreSQL and the app
docker-compose up

# Or run in detached mode
docker-compose up -d
```

This will:
- Start a PostgreSQL 15 container
- Build and start the Next.js app container
- Automatically run migrations and import the parquet dataset
- Expose the app at [http://localhost:3000](http://localhost:3000)

To stop:

```bash
docker-compose down

# To also remove the database volume:
docker-compose down -v
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required

```bash
# PostgreSQL connection string
POSTGRES_URL=postgresql://user:password@host:port/database

# Secret for NextAuth.js session encryption
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-secret-key-here

# NextAuth URL (your application URL)
NEXTAUTH_URL=http://localhost:3000

# OpenAI API Key for AI model access
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Optional

```bash
# Redis URL for caching (optional but recommended for production)
REDIS_URL=redis://localhost:6379

# Node environment
NODE_ENV=development

# Skip migrations in instrumentation (used by Docker)
SKIP_INSTRUMENTATION_MIGRATIONS=false
```

### Using Your Own Dataset

To use a different dataset:

1. Prepare your data in Parquet format
2. Update the schema in `lib/db/schema.ts` to match your data structure
3. Generate new migrations: `pnpm db:generate`
4. Import your data: `pnpm db:import path/to/your-data.parquet`

## Project Structure

```
genie-on-a-budget/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication routes
│   └── (chat)/              # Chat interface and API routes
├── components/              # React components
│   ├── chat.tsx            # Main chat interface
│   ├── sql-section.tsx     # SQL query display
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── ai/                 # AI SDK integration
│   │   ├── models.ts       # Model configuration
│   │   ├── prompts.ts      # System prompts
│   │   └── tools/          # AI tools (SQL generation)
│   └── db/                 # Database layer
│       ├── schema.ts       # Drizzle schema definitions
│       ├── queries.ts      # Database queries
│       └── migrations/     # SQL migrations
├── scripts/
│   ├── import-parquet.ts   # Parquet data import script
│   └── start.sh           # Docker startup script
├── data/                   # Dataset files
├── docker-compose.yml      # Docker orchestration
├── Dockerfile             # App container definition
└── .env                   # Environment variables (create this)
```

## Development

```bash
# Run linter
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test

# Database operations
pnpm db:generate  # Generate migrations from schema changes
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
pnpm db:push      # Push schema changes without migrations
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL 15 with Drizzle ORM
- **AI**: Vercel AI SDK with xAI Grok models (via AI Gateway)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui, Radix UI
- **Auth**: Auth.js (NextAuth v5)
- **Data Import**: Parquet.js for reading Parquet files
- **Deployment**: Docker, Docker Compose

## License

MIT
