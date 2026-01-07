"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCustomers, Customer } from "../contexts/CustomerContext";
import { useApp } from "../contexts/AppContext";
import CustomerAutocomplete from "../components/CustomerAutocomplete";

/**
 * Client creation page component
 * Allows users to create new clients and assign them to customers
 */
export default function ClientCreate() {
  const router = useRouter();
  const { customers } = useCustomers();
  const { formDraft, saveFormDraft, clearFormDraft } = useApp();
  
  const [formData, setFormData] = useState({
    name: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [recurringInterval, setRecurringInterval] = useState<"day" | "week" | "month" | "year">("month");
  const [recurringQuantity, setRecurringQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Create flattened list the SAME way as homepage, then filter to sub-orgs only
  const allCustomersFlattened = customers.reduce<(Customer & { uniqueKey?: string; parent_org_id?: string })[]>((acc, customer) => {
    // Add the main customer with unique key
    acc.push({
      ...customer,
      uniqueKey: `org-${customer.id}`,
    });
    
    // Add all sub-orgs with parent org name attached
    if (customer.suborgs && customer.suborgs.length > 0) {
      const subOrgsWithParent = customer.suborgs.map((suborg, index) => ({
        ...suborg,
        parent_org_name: customer.name,
        parent_org_id: customer.id,
        uniqueKey: `suborg-${customer.id}-${suborg.id || index}`,
      }));
      acc.push(...subOrgsWithParent);
    }
    
    return acc;
  }, []);

  // Filter to only show sub-orgs for client assignment
  const allSubOrgs = allCustomersFlattened.filter(c => c.customer_type === "sub-org");


  /**
   * Handles form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate customer selection
    if (!selectedCustomer) {
      setError("Please select a sub-organization");
      return;
    }

    setIsSubmitting(true);

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_CREATE_CLIENT;
      
      if (!webhookUrl) {
        throw new Error('NEXT_PUBLIC_WEBHOOK_CREATE_CLIENT is not configured');
      }

      const clientData: any = {
        name: formData.name,
        customer_id: selectedCustomer.id,
        org_name: selectedCustomer.name,
        recurring_interval: recurringInterval,
        recurring_quantity: recurringQuantity,
      };

      // Add parent org details if this is a sub-org
      if (selectedCustomer.customer_type === "sub-org") {
        const selectedWithParent = selectedCustomer as Customer & { parent_org_id?: string };
        if (selectedWithParent.parent_org_id) {
          clientData.parent_org_id = selectedWithParent.parent_org_id;
        }
        if (selectedCustomer.parent_org_name) {
          clientData.parent_org_name = selectedCustomer.parent_org_name;
        }
      }

      console.log('Sending client data:', clientData);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create client: ${response.statusText}`);
      }

      console.log('Client created successfully');
      
      // Clear form draft on successful submission
      clearFormDraft();
      
      setSuccess(true);
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
      setIsSubmitting(false);
    }
  };

  /**
   * Handles input changes
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const updated = {
      ...formData,
      [name]: value,
    };
    setFormData(updated);
  };

  /**
   * Handles customer selection
   */
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Client</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Add a new client and assign them to a customer organization
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400 dark:text-green-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Client created successfully! Redirecting...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400 dark:text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Selection Field */}
          <div>
            <label
              htmlFor="customer"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Sub-Organization <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <CustomerAutocomplete
              customers={allSubOrgs}
              value={customerSearch}
              onChange={setCustomerSearch}
              onSelectCustomer={handleSelectCustomer}
            />
            {selectedCustomer && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-green-600 dark:text-green-400">
                  ✓ Selected: {selectedCustomer.parent_org_name} / {selectedCustomer.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                >
                  Clear
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Search and select the sub-organization this client belongs to
            </p>
          </div>

          {/* Client Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Client Name <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white dark:bg-gray-700"
              placeholder="Enter client name"
              disabled={isSubmitting || success}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Full name of the client
            </p>
          </div>

          {/* Recurring Interval Field */}
          <div>
            <label
              htmlFor="recurringInterval"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Recurring Interval <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              id="recurringInterval"
              name="recurringInterval"
              required
              value={recurringInterval}
              onChange={(e) => setRecurringInterval(e.target.value as "day" | "week" | "month" | "year")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white dark:bg-gray-700"
              disabled={isSubmitting || success}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Billing frequency for this client
            </p>
          </div>

          {/* Recurring Quantity Field */}
          <div>
            <label
              htmlFor="recurringQuantity"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Recurring Quantity <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="number"
              id="recurringQuantity"
              name="recurringQuantity"
              required
              min="1"
              value={recurringQuantity}
              onChange={(e) => setRecurringQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white dark:bg-gray-700"
              disabled={isSubmitting || success}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Number of intervals between billing (e.g., 1 month, 3 months, etc.)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </button>
            <a
              href="/"
              className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          About Clients
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>
            Clients are end users who use the subscription services
          </li>
          <li>
            Each client must be assigned to a customer organization or sub-organization
          </li>
          <li>
            Client counts are tracked per customer for billing purposes
          </li>
        </ul>
      </div>
    </div>
  );
}

