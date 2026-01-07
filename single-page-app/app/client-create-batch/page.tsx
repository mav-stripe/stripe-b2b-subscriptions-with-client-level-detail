"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCustomers, Customer } from "../contexts/CustomerContext";
import CustomerAutocomplete from "../components/CustomerAutocomplete";
import { faker } from '@faker-js/faker';

/**
 * Batch client creation page component
 * Allows users to create multiple clients with random names at once
 */
export default function ClientCreateBatch() {
  const router = useRouter();
  const { customers } = useCustomers();
  
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [numberOfClients, setNumberOfClients] = useState(10);
  const [recurringInterval, setRecurringInterval] = useState<"day" | "week" | "month" | "year">("month");
  const [recurringQuantity, setRecurringQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [createdClients, setCreatedClients] = useState<string[]>([]);

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
   * Generate a random client name
   */
  const generateRandomName = () => {
    return faker.person.fullName();
  };

  /**
   * Handles form submission - creates multiple clients
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCreatedClients([]);

    // Validate customer selection
    if (!selectedCustomer) {
      setError("Please select a sub-organization");
      return;
    }

    // Validate number of clients
    if (numberOfClients < 1 || numberOfClients > 1000) {
      setError("Please enter a number between 1 and 1000");
      return;
    }

    setIsSubmitting(true);
    setProgress({ current: 0, total: numberOfClients });

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_CREATE_CLIENT;
      
      if (!webhookUrl) {
        throw new Error('NEXT_PUBLIC_WEBHOOK_CREATE_CLIENT is not configured');
      }

      const created: string[] = [];
      let successCount = 0;
      let failCount = 0;

      // Create clients one by one
      for (let i = 0; i < numberOfClients; i++) {
        try {
          const clientName = generateRandomName();
          
          const clientData: any = {
            name: clientName,
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

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData),
          });
          
          if (response.ok) {
            created.push(clientName);
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to create client ${clientName}`);
          }
        } catch (err) {
          failCount++;
          console.error(`Error creating client ${i + 1}:`, err);
        }

        // Update progress
        setProgress({ current: i + 1, total: numberOfClients });
        setCreatedClients([...created]);
      }

      if (failCount > 0) {
        setError(`Created ${successCount} clients successfully, ${failCount} failed`);
      }

      setSuccess(true);
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create clients");
      setIsSubmitting(false);
    }
  };

  /**
   * Handles customer selection
   */
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
  };

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Batch Create Clients</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Generate multiple clients with random names at once
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
                    Successfully created {createdClients.length} clients! Redirecting...
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
              All clients will be assigned to this sub-organization
            </p>
          </div>

          {/* Number of Clients Field */}
          <div>
            <label
              htmlFor="numberOfClients"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Number of Clients <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="number"
              id="numberOfClients"
              name="numberOfClients"
              required
              min="1"
              max="1000"
              value={numberOfClients}
              onChange={(e) => setNumberOfClients(parseInt(e.target.value) || 10)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white dark:bg-gray-700"
              disabled={isSubmitting || success}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              How many clients to create (1-1000)
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
              Billing frequency for all clients
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

          {/* Progress Bar */}
          {isSubmitting && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Creating clients...</span>
                <span>{progress.current} / {progress.total} ({progressPercentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

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
                  Creating {progress.current}/{progress.total}...
                </>
              ) : (
                `Create ${numberOfClients} Clients`
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

      {/* Created Clients List */}
      {createdClients.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Created Clients ({createdClients.length})
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {createdClients.map((name, index) => (
              <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          About Batch Client Creation
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>
            Client names are randomly generated using realistic data
          </li>
          <li>
            All clients will be assigned to the selected customer organization
          </li>
          <li>
            Progress is shown in real-time during creation
          </li>
          <li>
            Maximum 1000 clients can be created at once
          </li>
        </ul>
      </div>
    </div>
  );
}

