# AGENTS.md
## description
A nextjs single page app that demonstrates how a B2B subscription portal works with a number of Stripe features. This PoC demonstrates a b2b implementation use case where businesses are customers and manage their subscriptions through the platform.

When creating or updating a new page update agents.md where appropriate.

Ask if anything is not clear.


## configuration
API keys should be in /.env.local file. Any other value that should be configurable should be stored there. When a new value is introduced, add the variable to the env file with an appropriate placeholder value.


### Environment Variables

**Stripe Configuration:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for client-side
- `STRIPE_SECRET_KEY` - Stripe secret key for server-side API calls
- `NEXT_PUBLIC_STRIPE_ACCOUNT` - Stripe account ID for dashboard links (e.g., acct_1S3TwPQ8CnbogUZd)


**Webhook Endpoints:**
The back end uses n8n for all its logic. All webhook endpoints configuration variables here:
- `NEXT_PUBLIC_WEBHOOK_GET_CUSTOMERS` - Fetch all customers
- `NEXT_PUBLIC_WEBHOOK_CREATE_CUSTOMER` - Create new customer
- `NEXT_PUBLIC_WEBHOOK_UPDATE_CUSTOMER` - Update existing customer
- `NEXT_PUBLIC_WEBHOOK_DELETE_CUSTOMER` - Delete customer
- `NEXT_PUBLIC_WEBHOOK_CREATE_CLIENT` - Create new client
- `NEXT_PUBLIC_WEBHOOK_GET_CLIENTS` - Fetch clients for a sub-org
- `NEXT_PUBLIC_WEBHOOK_PAUSE_SUBSCRIPTION` - Pause a client subscription
- `NEXT_PUBLIC_WEBHOOK_RESUME_SUBSCRIPTION` - Resume a paused subscription
- `NEXT_PUBLIC_WEBHOOK_GET_STATS` - Fetch overall statistics for the dashboard


## UI
The app utilises tailwind css for all components and styling

### Dark Mode
- **Class-based dark mode** enabled in Tailwind config
- **Theme toggle** button in navigation bar (sun/moon icon)
- **localStorage persistence** - user preference is saved and restored
- **System preference detection** - defaults to OS preference if no saved preference
- All components support both light and dark themes with appropriate color schemes 


## project structure
```
crypto-tax-calculator-demo/
├── app/
│   ├── components/
│   │   └── ThemeToggle.tsx    # Dark mode toggle component
│   ├── contexts/
│   │   ├── AppContext.tsx     # App-wide state (preferences, drafts, filters)
│   │   └── CustomerContext.tsx # Customer data management with localStorage
│   ├── customer-create/
│   │   └── page.tsx           # Customer creation form page
│   ├── globals.css            # Global styles with Tailwind directives
│   ├── layout.tsx             # Root layout with context providers
│   └── page.tsx               # Homepage with customer list
├── .env.local                 # Environment variables (git-ignored)
├── .gitignore                 # Git ignore file
├── agents.md                  # This file - project documentation
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration for Tailwind
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```


## setup commands
```bash
cd nine-poc
npm install
```


## run the app
npm run dev


## Code style
- TypeScript strict mode
- Use functional patterns where possible
- Document code

## State Management
The app uses **React Context API + localStorage** for persistent state management across pages.

### Contexts

**CustomerContext** (`app/contexts/CustomerContext.tsx`)
- Manages all customer data (CRUD operations)
- Fetches data from n8n webhook endpoints (no localStorage persistence)
- Provides `useCustomers()` hook for easy access
- Functions: `addCustomer()`, `updateCustomer()`, `deleteCustomer()`, `refreshCustomers()`, `getCustomer()`
- Uses optimistic updates for better UX

**AppContext** (`app/contexts/AppContext.tsx`)
- Manages app-wide state and user preferences
- Handles form draft auto-save (24-hour expiry)
- Manages search/filter state across navigation
- Provides `useApp()` hook for easy access
- Features: preferences, form drafts, search query, filter type

### Usage Example
```typescript
// In any component:
import { useCustomers } from '../contexts/CustomerContext';
import { useApp } from '../contexts/AppContext';

const { customers, addCustomer, loading } = useCustomers();
const { searchQuery, setSearchQuery } = useApp();
```


# routes


## /
The homepage of the PoC. Presents a list of customers with statistics dashboard and expandable sub-organizations.

**Statistics Cards:**
- Total Orgs
- Total Sub-Orgs
- Total Clients
- Active Clients (green)
- Paused Clients (yellow)

**Features:**
- Fetches overall stats from webhook: `NEXT_PUBLIC_WEBHOOK_GET_STATS`
- Search functionality across customer and sub-org names
- Expandable rows to view sub-organizations
- "View Clients" link for sub-orgs (opens `/clients-view`)
- Dark mode support

**Stats Webhook Request:**
```json
POST { "key": "overall_stats" }
```

**Expected Response:**
```json
[{
  "totalOrgs": 4,
  "totalSubOrgs": 5,
  "totalClients": 584,
  "totalActiveClients": 583,
  "totalPausedClients": 1
}]
``` 

## /customer-create
This page allows the user to create a new customer with auto-save draft functionality.

**Form Fields:**
- `name` - Customer/organization name (required)
- `customer_type` - Either "org" or "sub-org" (required)
- `parent_org_id` - Parent organization ID (required for sub-orgs)

**Features:**
- Auto-saves form draft to localStorage (500ms debounce)
- Draft restoration prompt (24-hour expiry)
- Success/error notifications
- Redirects to homepage after successful creation
- Clears draft on successful submission
- Autocomplete for parent organization selection

## /client-create-batch
This page uses the @faker-js/faker library to generate random client names (eg john doe).

**Form Fields:**
- `customer_id` - Sub-organization to assign clients to (required, via autocomplete, sub-orgs only)
- `numberOfClients` - Number of clients to create (1-1000, required)
- `recurringInterval` - Billing frequency: day, week, month, year (default: month)
- `recurringQuantity` - Number of intervals between billing (default: 1)

**Features:**
- Generates random names using faker.js
- Creates clients sequentially
- Shows progress bar and percentage
- Displays list of created clients
- Shows success/error messages
- Auto-redirects to homepage on completion
- Dark mode support

**Webhook Payload:**
```json
{
  "name": "John Doe",
  "customer_id": "38",
  "org_name": "box hill",
  "parent_org_id": "36",
  "parent_org_name": "The Hills Accountants",
  "recurring_interval": "month",
  "recurring_quantity": 1
}
``` 
 

## /client-create
This page allows the user to create a new client and assign them to a sub-organization.

**Form Fields:**
- `customer_id` - Sub-organization to assign client to (required, via autocomplete, sub-orgs only)
- `name` - Client's full name (required)
- `recurringInterval` - Billing frequency: day, week, month, year (default: month)
- `recurringQuantity` - Number of intervals between billing (default: 1)

**Webhook Payload:**
```json
{
  "name": "Client Name",
  "customer_id": "30",
  "org_name": "Sub-Org Name",
  "parent_org_id": "29",
  "parent_org_name": "Parent Org Name",
  "recurring_interval": "month",
  "recurring_quantity": 1
}
```

**Features:**
- Sub-organization search with autocomplete (only sub-orgs, not parent orgs)
- Shows parent org for sub-orgs in format "Parent / Sub-org"
- Automatically includes parent org details in webhook payload
- Recurring billing interval and quantity selection
- Success/error notifications
- Redirects to homepage after successful creation
- Webhook endpoint: `NEXT_PUBLIC_WEBHOOK_CREATE_CLIENT`

## /clients-view
This page displays clients for a specific sub-organization.

**URL Parameters:**
- `suborg` - Required. The sub-organization ID
- `name` - Optional. The sub-organization name (for display)
- `parent` - Optional. The parent organization name (for breadcrumb)

**Example URL:** `/clients-view?suborg=38&name=box%20hill&parent=The%20Hills%20Accountants`

**Table Columns:**
- `Client Name` - The client's name
- `Status` - Subscription status (active, paused, canceled) with color-coded badges
- `Created` - Date the client was created
- `Actions` - Pause/Resume, Open in Stripe Dashboard

**Features:**
- Fetches clients from webhook with `customer_id` in POST body
- Pause/Resume subscription functionality with icon buttons
- Open subscription in Stripe Dashboard (new window)
- Status badges (green for active, yellow for paused, red for canceled)
- Breadcrumb navigation showing: Parent Org / Sub-Org / Clients
- Stats card showing total clients count
- Empty state with links to create clients
- Dark mode support
- Accessed via "View Clients" link on sub-orgs in homepage

**Get Clients Webhook:** `NEXT_PUBLIC_WEBHOOK_GET_CLIENTS`
```json
POST { "customer_id": "38" }
```

**Response:**
```json
[
  {
    "Id": 1,
    "CreatedAt": "2025-12-02 05:40:07+00:00",
    "name": "John Doe",
    "customer_id": "38",
    "org_name": "box hill",
    "stripe_subscription_id": "sub_xxx",
    "stripe_subscription_status": "active"
  }
]
```

**Pause Subscription Webhook:** `NEXT_PUBLIC_WEBHOOK_PAUSE_SUBSCRIPTION`
```json
POST {
  "customer_id": "38",
  "stripe_subscription_id": "sub_xxx",
  "db_status": "paused",
  "stripe_status": "void"
}
```

**Resume Subscription Webhook:** `NEXT_PUBLIC_WEBHOOK_RESUME_SUBSCRIPTION`
```json
POST {
  "customer_id": "38",
  "stripe_subscription_id": "sub_xxx",
  "db_status": "active",
  "stripe_status": ""
}
```

# Other 

## do not use in code anywhere anything that resembles PII data like a valid email address 