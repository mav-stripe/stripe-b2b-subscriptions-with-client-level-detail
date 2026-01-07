# B2B Subscription Portal with Client-Level Detail

A comprehensive demonstration of B2B subscription management using Stripe, featuring client-level subscription tracking within organizations and sub-organizations. This proof-of-concept showcases how businesses can manage multi-level customer hierarchies with individual client subscriptions.

## Features

- **Multi-Level Customer Management**: Organizations → Sub-Organizations → Individual Clients
- **Client-Level Subscriptions**: Each client within a sub-org has their own Stripe subscription
- **Subscription Control**: Pause and resume individual client subscriptions
- **Real-time Statistics**: Dashboard showing total orgs, sub-orgs, active/paused clients
- **Stripe Integration**: Direct links to Stripe Dashboard for each subscription
- **Batch Client Creation**: Generate multiple test clients with faker.js
- **Modern UI**: Dark mode support, Tailwind CSS, responsive design
- **n8n Backend**: All business logic handled via webhook endpoints

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript (strict mode)
- **Styling**: Tailwind CSS with dark mode
- **Payments**: Stripe (subscriptions, customer management)
- **Backend**: n8n workflows with PostgreSQL database
- **Orchestration**: Docker Compose

## Project Structure

```
stripe-b2b-subscriptions-with-client-level-detail/
├── docker/                          # n8n and database setup
│   ├── docker-compose.yml          # Container orchestration
│   └── n8n-shared/
│       ├── b2b-subscriptions-schema/  # Database schemas
│       ├── n8n-workflows/          # Pre-built workflows
│       └── workflow-exports/       # Exported workflow files
│
└── single-page-app/                # Next.js application
    ├── app/
    │   ├── client-create/          # Create individual client
    │   ├── client-create-batch/    # Batch create clients
    │   ├── clients-view/           # View clients for a sub-org
    │   ├── customer-create/        # Create org/sub-org
    │   ├── components/             # Reusable UI components
    │   └── contexts/               # React Context (state management)
    ├── agents.md                   # Detailed project documentation
    ├── WEBHOOK_INTEGRATION.md      # n8n webhook setup guide
    └── .env.example                # Environment variables template
```

## Quick Start

### 1. Set Up n8n Backend (Optional)

If you want to run the full stack with database and workflows:

```bash
cd docker
docker-compose up -d
```

This starts:
- n8n workflow automation (http://localhost:5678)
- PostgreSQL database

### 2. Set Up Next.js App

```bash
cd single-page-app
npm install
```

### 3. Configure Environment Variables

Copy the example file and add your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_ACCOUNT=acct_...

# n8n Webhook Endpoints (configure after setting up n8n)
NEXT_PUBLIC_WEBHOOK_GET_STATS=https://your-n8n/webhook/get-stats
NEXT_PUBLIC_WEBHOOK_GET_CUSTOMERS=https://your-n8n/webhook/get-customers
NEXT_PUBLIC_WEBHOOK_CREATE_CUSTOMER=https://your-n8n/webhook/create-customer
NEXT_PUBLIC_WEBHOOK_CREATE_CLIENT=https://your-n8n/webhook/create-client
NEXT_PUBLIC_WEBHOOK_GET_CLIENTS=https://your-n8n/webhook/get-clients
NEXT_PUBLIC_WEBHOOK_PAUSE_SUBSCRIPTION=https://your-n8n/webhook/pause-subscription
NEXT_PUBLIC_WEBHOOK_RESUME_SUBSCRIPTION=https://your-n8n/webhook/resume-subscription
```

See `.env.example` for the complete list of variables.

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Application Routes

### `/` - Dashboard & Customer List
- Overall statistics (total orgs, sub-orgs, clients, active/paused counts)
- List of all organizations and sub-organizations
- Expandable rows to view sub-organizations within a parent org
- Search across organization names
- "View Clients" button for sub-orgs

### `/customer-create` - Create Organization/Sub-Organization
- Create new top-level organizations
- Create sub-organizations within parent orgs
- Auto-save draft functionality
- Parent org autocomplete for sub-orgs

### `/client-create` - Create Individual Client
- Assign client to a sub-organization
- Configure recurring billing interval (day/week/month/year)
- Automatically includes parent org details
- Creates Stripe subscription for the client

### `/client-create-batch` - Batch Create Clients
- Generate 1-1000 clients at once with random names (faker.js)
- Progress tracking with percentage and list of created clients
- Useful for testing and demos

### `/clients-view` - View Clients for Sub-Organization
- List all clients within a sub-org
- Client subscription status (active/paused/canceled)
- Pause/Resume subscription buttons
- Direct links to Stripe Dashboard
- Breadcrumb navigation (Parent Org / Sub-Org / Clients)

## Documentation

- **[agents.md](single-page-app/agents.md)** - Comprehensive project documentation, route details, state management
- **[WEBHOOK_INTEGRATION.md](single-page-app/WEBHOOK_INTEGRATION.md)** - Guide to connecting n8n webhooks

## Key Features Explained

### Multi-Level Hierarchy
```
Organization (Stripe Customer)
  └── Sub-Organization (Stripe Customer)
        └── Client 1 (Stripe Subscription)
        └── Client 2 (Stripe Subscription)
        └── Client 3 (Stripe Subscription)
```

### Subscription Management
- Each **client** has their own Stripe subscription
- Sub-organizations manage multiple client subscriptions
- Pause/Resume subscriptions individually
- Track active vs paused client counts across the entire system

### Dark Mode
- System preference detection
- Manual toggle in navigation bar
- Preference saved to localStorage
- Full support across all pages and components

## Development

### Code Style
- TypeScript strict mode
- Functional components and hooks
- Tailwind CSS for styling
- Document all components

### State Management
- **CustomerContext**: Customer CRUD operations via webhooks
- **AppContext**: App-wide state (preferences, drafts, filters)
- React Context API + localStorage for persistence

## Environment Variables Reference

See [single-page-app/.env.example](single-page-app/.env.example) for the complete list with descriptions.

**Required for basic functionality:**
- Stripe publishable and secret keys
- At minimum: GET_STATS, GET_CUSTOMERS, CREATE_CUSTOMER webhooks

**Optional but recommended:**
- All client management webhooks (for full CRUD)
- Subscription pause/resume webhooks
- Stripe account ID (for dashboard links)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.

## Security

For security concerns, see [SECURITY.md](SECURITY.md).

## License

See [LICENSE.md](LICENSE.md) for details.

