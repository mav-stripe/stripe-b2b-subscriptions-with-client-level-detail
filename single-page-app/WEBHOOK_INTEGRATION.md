# Webhook Integration Guide

This document explains how to connect your n8n webhook endpoints to the application.

## Overview

Customer data is **not** persisted in localStorage. Instead, all customer operations (Create, Read, Update, Delete) are handled through n8n webhook endpoints.

## Required Webhook Endpoints

You need to create 4 webhook endpoints in n8n:

### 1. Get All Customers
**Environment Variable:** `NEXT_PUBLIC_WEBHOOK_GET_CUSTOMERS`

**Method:** GET  
**Response Format:**
```json
[
  {
    "id": "cus_123456",
    "name": "Example Company",
    "customer_type": "org",
    "created": 1234567890,
    "email": "example@example.com",
    "metadata": {}
  }
]
```

---

### 2. Create Customer
**Environment Variable:** `NEXT_PUBLIC_WEBHOOK_CREATE_CUSTOMER`

**Method:** POST  
**Request Body:**

For Organizations:
```json
{
  "name": "New Customer Name",
  "customer_type": "org"
}
```

For Sub-Organizations:
```json
{
  "name": "New Customer Name",
  "customer_type": "sub-org",
  "parent_org_id": "2"
}
```

**Response Format:**
```json
{
  "id": "cus_789012",
  "name": "New Customer Name",
  "customer_type": "org",
  "created": 1234567890
}
```

---

### 3. Update Customer
**Environment Variable:** `NEXT_PUBLIC_WEBHOOK_UPDATE_CUSTOMER`

**Method:** POST  
**Request Body:**
```json
{
  "id": "cus_123456",
  "name": "Updated Name",
  "customer_type": "sub-org"
}
```

**Response Format:**
```json
{
  "success": true
}
```

---

### 4. Delete Customer
**Environment Variable:** `NEXT_PUBLIC_WEBHOOK_DELETE_CUSTOMER`

**Method:** POST  
**Request Body:**
```json
{
  "id": "cus_123456"
}
```

**Response Format:**
```json
{
  "success": true
}
```

---

## Setup Instructions

### 1. Add Environment Variables

Create or update `.env.local` in the project root:

```env
# n8n Webhook Endpoints
NEXT_PUBLIC_WEBHOOK_GET_CUSTOMERS=https://your-n8n.com/webhook/get-customers
NEXT_PUBLIC_WEBHOOK_CREATE_CUSTOMER=https://your-n8n.com/webhook/create-customer
NEXT_PUBLIC_WEBHOOK_UPDATE_CUSTOMER=https://your-n8n.com/webhook/update-customer
NEXT_PUBLIC_WEBHOOK_DELETE_CUSTOMER=https://your-n8n.com/webhook/delete-customer
```

### 2. Update CustomerContext

The webhook integration code is already prepared in `app/contexts/CustomerContext.tsx`. To activate it:

1. Open `app/contexts/CustomerContext.tsx`
2. Find the TODO comments in each function
3. Uncomment the webhook fetch code
4. Remove or comment out the temporary simulation code

**Example for `addCustomer`:**

```typescript
// BEFORE (temporary simulation):
await new Promise((resolve) => setTimeout(resolve, 500));
const newCustomer: Customer = { ... };

// AFTER (actual webhook):
const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_CREATE_CUSTOMER;
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(customerData),
});

if (!response.ok) {
  throw new Error('Failed to create customer');
}

const newCustomer = await response.json();
```

### 3. Test Each Endpoint

After updating the code:

1. **Test GET:** Load the homepage - it should fetch customers
2. **Test CREATE:** Use the `/customer-create` form
3. **Test UPDATE:** (Future feature when edit page is built)
4. **Test DELETE:** (Future feature when delete button is built)

---

## Error Handling

The app includes built-in error handling:

- Network errors are caught and displayed to users
- Failed requests show error messages
- Loading states are shown during API calls
- Optimistic updates provide instant UI feedback

---

## Current Behavior (Without Webhooks)

Until you connect the webhooks:

- The app simulates API calls with delays
- Creates mock customers with temporary IDs
- Customers persist only in component state (lost on page refresh)
- All CRUD operations work, but data isn't saved

---

## n8n Workflow Example

Here's a basic structure for your n8n workflows:

### Get Customers Workflow
1. **Webhook** node (GET request)
2. **Database Query** node (SELECT * FROM customers)
3. **Respond to Webhook** node (return JSON array)

### Create Customer Workflow
1. **Webhook** node (POST request)
2. **Set** node (extract name, customer_type from body)
3. **Database Insert** node (INSERT into customers)
4. **Respond to Webhook** node (return created customer)

### Update Customer Workflow
1. **Webhook** node (POST request)
2. **Set** node (extract id and updates from body)
3. **Database Update** node (UPDATE customers WHERE id = ...)
4. **Respond to Webhook** node (return success)

### Delete Customer Workflow
1. **Webhook** node (POST request)
2. **Set** node (extract id from body)
3. **Database Delete** node (DELETE FROM customers WHERE id = ...)
4. **Respond to Webhook** node (return success)

---

## Troubleshooting

### Customers not loading?
- Check browser console for network errors
- Verify `NEXT_PUBLIC_WEBHOOK_GET_CUSTOMERS` is set correctly
- Ensure n8n webhook is active and accessible
- Check CORS settings on your n8n instance

### Create customer fails?
- Verify request body format matches expected schema
- Check n8n logs for errors
- Ensure database connection is working
- Validate customer_type is "org" or "sub-org"

### CORS Issues?
Add CORS headers in your n8n webhook response:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
```

---

## Next Steps

After connecting webhooks:

1. Remove the temporary simulation code
2. Add error retry logic if needed
3. Implement pagination for large customer lists
4. Add caching strategy to reduce API calls
5. Build customer detail and edit pages

