# Context API Documentation

This directory contains React Context providers for global state management with localStorage persistence.

## Contexts

### CustomerContext

**File:** `CustomerContext.tsx`

Manages all customer-related data and operations.

**State:**
- `customers: Customer[]` - Array of all customers
- `loading: boolean` - Loading state
- `error: string | null` - Error messages

**Methods:**
- `addCustomer(data)` - Create a new customer
- `updateCustomer(id, updates)` - Update existing customer
- `deleteCustomer(id)` - Delete a customer
- `refreshCustomers()` - Reload customers from API
- `getCustomer(id)` - Get single customer by ID

**Storage:** 
- Customer data is NOT stored in localStorage
- All data comes from n8n webhook endpoints
- Uses optimistic updates for instant UI feedback

**Usage:**
```typescript
import { useCustomers } from './contexts/CustomerContext';

function MyComponent() {
  const { customers, addCustomer, loading } = useCustomers();
  
  const handleCreate = async () => {
    await addCustomer({ name: "Example Org", customer_type: "org" });
  };
  
  return <div>{customers.length} customers</div>;
}
```

---

### AppContext

**File:** `AppContext.tsx`

Manages application-wide state, user preferences, and UI state.

**State:**
- `preferences` - User preferences (items per page, defaults, etc.)
- `formDraft` - Auto-saved form data with timestamp
- `searchQuery` - Current search query
- `filterType` - Current filter selection

**Methods:**
- `updatePreferences(updates)` - Update user preferences
- `saveFormDraft(draft)` - Save form draft (auto-expires after 24h)
- `clearFormDraft()` - Clear saved draft
- `setSearchQuery(query)` - Update search
- `setFilterType(type)` - Update filter

**Storage Keys:**
- `b2b-portal-preferences` - User preferences
- `b2b-portal-form-draft` - Form draft data

**Usage:**
```typescript
import { useApp } from './contexts/AppContext';

function MyComponent() {
  const { searchQuery, setSearchQuery, formDraft, saveFormDraft } = useApp();
  
  const handleChange = (e) => {
    saveFormDraft({ name: e.target.value, customer_type: "org" });
  };
  
  return <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />;
}
```

## Provider Setup

Both contexts are wrapped in `app/layout.tsx`:

```typescript
<AppProvider>
  <CustomerProvider>
    {children}
  </CustomerProvider>
</AppProvider>
```

## localStorage Structure

### Preferences
```json
{
  "b2b-portal-preferences": {
    "itemsPerPage": 10,
    "defaultCustomerType": "org",
    "showWelcomeMessage": true
  }
}
```

### Form Draft
```json
{
  "b2b-portal-form-draft": {
    "name": "Draft Customer",
    "customer_type": "org",
    "timestamp": 1234567890000
  }
}
```

## Error Handling

Both contexts handle errors gracefully:
- Failed localStorage reads/writes are logged to console
- API errors are caught and stored in context state
- Contexts provide fallback behavior when storage fails

## Best Practices

1. **Always use the hooks** (`useCustomers()`, `useApp()`) instead of accessing context directly
2. **Handle loading states** when data is being fetched
3. **Display error messages** when operations fail
4. **Clear drafts** after successful form submissions
5. **Validate data** before calling context methods

