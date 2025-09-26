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

## MCP Tools

This branch includes a Model Context Protocol (MCP) server with the following tools available:

- **search-customers** - Search for customers by name, email, or organization
- **get-customer-profile** - Get detailed information about a specific customer
- **change-customer-plan** - Update a customer's subscription plan
- **credit-account** - Add credits to a customer's account
- **send-email-to-customer** - Send email notifications to customers

## Scripts

```bash
pnpm dev           # Development server
pnpm build         # Build for production
pnpm db:seed       # Seed database
pnpm db:reset      # Reset database
pnpm test          # Run tests
```
