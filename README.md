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

### 1. Set Up n8n Backend (Required)

The single-page app requires the n8n backend to function. Start the Docker containers:

```bash
cd docker
docker-compose up -d
```

This starts:
- **n8n** workflow automation at http://localhost:5678
- **NocoDB** database interface at http://localhost:8080
- **PostgreSQL** database

#### Configure n8n

Once the containers are running, open http://localhost:5678 and complete the n8n setup:

**A. Create Credentials** (navigate to the Credentials tab in n8n):

1. **Stripe API Credentials**
   - Type: `Stripe API`
   - Add your Stripe sandbox API key
   - Save as "Stripe API"

2. **NocoDB API Token**
   - Open NocoDB at http://localhost:8080
   - Complete NocoDB setup and login
   - Generate an API token in NocoDB settings
   - Back in n8n, create credential type: `NocoDB API`
   - Paste your NocoDB API token
   - Save as "NocoDB API"

3. **n8n Header Auth** (for internal workflow communication)
   - In n8n, go to Settings → API
   - Generate or copy your n8n API key
   - Create credential type: `Header Auth`
   - Header Name: `X-N8N-API-KEY`
   - Header Value: (your n8n API key)
   - Save as "n8n API"

**B. Import Workflows:**

1. Navigate to the Workflows tab in n8n
2. Click "Import from File"
3. Import all workflow files from `docker/n8n-shared/n8n-workflows/` one by one:
   - `db-import-schema.json` - **Import this first!** Run it manually to create database tables (Requires: **NocoDB API**)
   - `db get cache value.json` (Requires: **NocoDB API**)
   - `db-create-client.json` (Requires: **NocoDB API**, **Stripe API**)
   - `db-customer-create.json` (Requires: **NocoDB API**)
   - `DB-get-clients-for-org.json` (Requires: **NocoDB API**)
   - `db-get-customers.json` (Requires: **NocoDB API**)
   - `db-update-org-client-counts.json` (Requires: **NocoDB API**)
   - `db-update-overall-stats.json` (Requires: **NocoDB API**)
   - `db-update-parent-org-client-counts.json` (Requires: **NocoDB API**)
   - `Subscription pause or resume.json` (Requires: **NocoDB API**, **Stripe API**)

4. For each imported workflow:
   - Open the workflow
   - Click on nodes that require credentials
   - Select the appropriate credential you created above (Stripe API, NocoDB API, or n8n API)
   - **Important:** Don't forget to click "Save" after assigning credentials
   - Toggle the workflow to "Active" (switch in top right)
   - For webhook workflows, this will activate the endpoint

5. Copy each webhook URL from the active workflows:
   - Open each workflow
   - Click on the Webhook node
   - Copy the "Production URL" shown (e.g., `http://localhost:5678/webhook/create-customer`)
   - You'll paste these into `.env.local` in Step 3

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
# Stripe Configuration (from your Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_ACCOUNT=acct_...

# n8n Webhook Endpoints (copied from your active n8n workflows in Step 1)
# These will be localhost URLs like: http://localhost:5678/webhook/...
NEXT_PUBLIC_WEBHOOK_GET_STATS=http://localhost:5678/webhook/get-stats
NEXT_PUBLIC_WEBHOOK_GET_CUSTOMERS=http://localhost:5678/webhook/get-customers
NEXT_PUBLIC_WEBHOOK_CREATE_CUSTOMER=http://localhost:5678/webhook/create-customer
NEXT_PUBLIC_WEBHOOK_CREATE_CLIENT=http://localhost:5678/webhook/create-client
NEXT_PUBLIC_WEBHOOK_GET_CLIENTS=http://localhost:5678/webhook/get-clients
NEXT_PUBLIC_WEBHOOK_PAUSE_SUBSCRIPTION=http://localhost:5678/webhook/pause-subscription
NEXT_PUBLIC_WEBHOOK_RESUME_SUBSCRIPTION=http://localhost:5678/webhook/resume-subscription
```

**Important:** Copy the actual webhook URLs from each active workflow in n8n. Each workflow's webhook URL is shown in the Webhook node when you open it.

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