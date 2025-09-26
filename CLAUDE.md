# AIDD CRM Project Configuration

## Project Overview
This is a modern Nuxt 4 (NOT Nuxt 3!) CRM application with SQLite database backend.

## Tech Stack
- **Framework**: Nuxt 4
- **Server**: Nitro (built into Nuxt)
- **Database**: SQLite with Drizzle ORM
- **Styling**: Simple CSS (black on white with minimal colors)
- **Testing**: Vitest for unit tests

## Database Schema
- **Users**: System users with authentication
- **Organizations**: Companies/entities in the CRM
- **Contacts**: People associated with organizations
- **Notes**: Activity tracking for contacts and organizations

## API Structure
- All API endpoints are in `server/api/`
- RESTful CRUD operations for all entities
- Database operations through Drizzle ORM

## UI Guidelines
- Simple black on white design
- Minimal color usage (only for links and buttons)
- All styles in a single CSS file
- Clean, modern, and functional design

## Commands
- `pnpm db:push` - Push schema changes to database
- `pnpm db:seed` - Seed database with sample data
- `pnpm test` - Run tests

## MCP (Model Context Protocol)
The application includes an MCP server with the following structure:
- **Server**: `server/mcp/server.ts` - Stateless Express middleware integrated with Nuxt
- **Tool Registration**: `server/mcp/registerTools.ts` - Handles tool registration
- **Tools Directory**: `server/mcp/tools/` containing:
  - `searchCustomers` - Search for customers in the database
  - `getCustomerProfile` - Get detailed customer information
  - `changeCustomerPlan` - Modify customer subscription plans
  - `creditAccount` - Add credits to customer accounts
  - `sendEmailToCustomer` - Send emails to customers