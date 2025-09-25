# AIDD CRM

A simple CRM system built with Nuxt 4 and SQLite, designed as the baseline for creating an MCP server in lesson 8.

Learn more at [aidd.io](https://aidd.io)

## Features

- Customer and organization management
- Purchase tracking
- User authentication
- Notes and activity logging

## Setup

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

## Login

Default credentials: `admin@crm.com` / `password123`

## Tech Stack

- Nuxt 4 + Vue 3
- SQLite + Drizzle ORM
- JWT authentication

## Scripts

```bash
pnpm dev           # Development server
pnpm build         # Build for production
pnpm db:seed       # Seed database
pnpm db:reset      # Reset database
pnpm test          # Run tests
```
