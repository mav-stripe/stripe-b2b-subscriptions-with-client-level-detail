"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * Customer type definition
 */
export interface Customer {
  id: string;
  name: string;
  customer_type: "org" | "sub-org";
  created: number;
  client_count?: number;
  suborgs?: Customer[];
  parent_org_name?: string;
  email?: string;
  metadata?: Record<string, string>;
}

/**
 * Customer context type
 */
interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  addCustomer: (customer: Omit<Customer, "id" | "created">) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
}

/**
 * Create the Customer Context
 */
const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

/**
 * Transform webhook response to match Customer interface
 * Handles different field naming conventions (Id vs id, CreatedAt vs created)
 */
function transformCustomerData(data: any): Customer {
  // Always convert id to string for consistency
  const rawId = data.id ?? data.Id ?? data.ID;
  const customerId = String(rawId);
  
  // Transform suborgs if they exist
  const rawSubOrgs = data.suborgs || data.subOrgs || data.SubOrgs || [];
  const transformedSubOrgs = Array.isArray(rawSubOrgs) 
    ? rawSubOrgs
        // Filter out the parent org itself and any non-sub-org entries
        .filter((suborg: any) => {
          const suborgRawId = suborg.id ?? suborg.Id ?? suborg.ID;
          const suborgId = String(suborgRawId);
          const suborgType = suborg.customer_type || suborg.customerType || "org";
          
          // Exclude if it's the same as parent ID or if it's not a sub-org
          return suborgId !== customerId && suborgType === "sub-org";
        })
        .map((suborg: any) => transformCustomerData(suborg))
    : [];

  return {
    id: customerId,
    name: data.name || data.Name || "",
    customer_type: data.customer_type || data.customerType || "org",
    created: data.created || 
             (data.CreatedAt ? new Date(data.CreatedAt).getTime() / 1000 : Math.floor(Date.now() / 1000)),
    client_count: data.client_count || data.clientCount || data.ClientCount || 0,
    suborgs: transformedSubOrgs,
    parent_org_name: data.parent_org_name || data.parentOrgName || data.ParentOrgName,
    email: data.email || data.Email,
    metadata: data.metadata || {},
  };
}


/**
 * Customer Context Provider
 * Manages customer state from webhook/API endpoints
 * Note: Customer data is NOT persisted to localStorage - it comes from the API
 */
export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load customers from API on mount
   */
  useEffect(() => {
    refreshCustomers();
  }, []);

  /**
   * Add a new customer via webhook endpoint
   */
  const addCustomer = async (customerData: Omit<Customer, "id" | "created">): Promise<Customer> => {
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_CREATE_CUSTOMER;
      
      if (!webhookUrl) {
        throw new Error('NEXT_PUBLIC_WEBHOOK_CREATE_CUSTOMER is not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create customer: ${response.statusText}`);
      }
      
      let rawCustomer = await response.json();
      console.log('Raw response from create webhook:', rawCustomer);

      // Handle if webhook returns an array instead of single object
      if (Array.isArray(rawCustomer)) {
        if (rawCustomer.length === 0) {
          throw new Error('Webhook returned empty array');
        }
        console.log('Webhook returned array, using first element');
        rawCustomer = rawCustomer[0];
      }

      // Transform the data to match our Customer interface
      const newCustomer = transformCustomerData(rawCustomer);

      // Validate transformed structure
      if (!newCustomer.id || !newCustomer.name) {
        console.error('Invalid customer response from webhook:', rawCustomer);
        throw new Error('Invalid response from webhook - missing required fields (id, name)');
      }

      console.log('Transformed customer:', newCustomer);

      // Add to state optimistically
      setCustomers((prev) => [...prev, newCustomer]);
      setError(null);
      return newCustomer;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create customer";
      setError(message);
      throw err;
    }
  };

  /**
   * Update an existing customer via webhook endpoint
   */
  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<void> => {
    try {
      // TODO: Replace with your n8n webhook URL
      // const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_UPDATE_CUSTOMER;
      // await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ id, ...updates }),
      // });

      // Temporary: Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update state optimistically
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id ? { ...customer, ...updates } : customer
        )
      );
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update customer";
      setError(message);
      throw err;
    }
  };

  /**
   * Delete a customer via webhook endpoint
   */
  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      // TODO: Replace with your n8n webhook URL
      // const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_DELETE_CUSTOMER;
      // await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ id }),
      // });

      // Temporary: Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update state optimistically
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete customer";
      setError(message);
      throw err;
    }
  };

  /**
   * Refresh customers from webhook endpoint
   */
  const refreshCustomers = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_GET_CUSTOMERS;
      
      if (!webhookUrl) {
        // If webhook not configured, start with empty array
        console.warn('NEXT_PUBLIC_WEBHOOK_GET_CUSTOMERS is not configured');
        setCustomers([]);
        return;
      }

      const response = await fetch(webhookUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('Raw data from GET webhook:', data);
      console.log('Is array?', Array.isArray(data));
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Expected array from webhook, got:', typeof data);
        setCustomers([]);
        return;
      }
      
      // Transform and validate each customer
      const validatedCustomers: Customer[] = [];
      const invalidCustomers: any[] = [];
      
      data.forEach((rawCustomer, index) => {
        if (!rawCustomer) {
          console.error(`Customer at index ${index} is null/undefined`);
          invalidCustomers.push({ index, reason: 'null or undefined', data: rawCustomer });
          return;
        }
        
        try {
          // Transform the customer data
          const customer = transformCustomerData(rawCustomer);
          
          // Validate required fields after transformation
          if (!customer.id) {
            console.error(`Customer at index ${index} missing 'id' after transform:`, rawCustomer);
            invalidCustomers.push({ index, reason: 'missing id', raw: rawCustomer, transformed: customer });
          } else if (!customer.name) {
            console.error(`Customer at index ${index} missing 'name' after transform:`, rawCustomer);
            invalidCustomers.push({ index, reason: 'missing name', raw: rawCustomer, transformed: customer });
          } else {
            validatedCustomers.push(customer);
          }
        } catch (err) {
          console.error(`Error transforming customer at index ${index}:`, err, rawCustomer);
          invalidCustomers.push({ index, reason: 'transform error', data: rawCustomer, error: err });
        }
      });
      
      if (invalidCustomers.length > 0) {
        console.error(`⚠️ Filtered out ${invalidCustomers.length} invalid customers:`, invalidCustomers);
      }
      
      console.log(`✅ Loaded ${validatedCustomers.length} valid customers:`, validatedCustomers);
      
      setCustomers(validatedCustomers);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh customers";
      setError(message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a single customer by ID
   */
  const getCustomer = (id: string): Customer | undefined => {
    return customers.find((customer) => customer.id === id);
  };

  const value: CustomerContextType = {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,
    getCustomer,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

/**
 * Custom hook to use the Customer Context
 * @throws Error if used outside of CustomerProvider
 */
export function useCustomers(): CustomerContextType {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error("useCustomers must be used within a CustomerProvider");
  }
  return context;
}

