"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCustomers, Customer } from "../contexts/CustomerContext";
import { useApp } from "../contexts/AppContext";
import CustomerAutocomplete from "../components/CustomerAutocomplete";

/**
 * Customer creation page component
 * Allows users to create new customers with name and type
 * Uses CustomerContext for state management and AppContext for form drafts
 */
export default function CustomerCreate() {
  const router = useRouter();
  const { addCustomer, customers } = useCustomers();
  const { formDraft, saveFormDraft, clearFormDraft } = useApp();
  
  const [formData, setFormData] = useState({
    name: "",
    customer_type: "org" as "org" | "sub-org",
  });
  const [parentOrgSearch, setParentOrgSearch] = useState("");
  const [selectedParentOrg, setSelectedParentOrg] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [hasDismissedDraft, setHasDismissedDraft] = useState(false);

  // Filter to get only organizations (for parent org selection)
  const organizations = customers.filter(c => c.customer_type === "org");

  /**
   * Load form draft on mount if available (only check once on mount)
   */
  useEffect(() => {
    if (formDraft && (formDraft.name || formDraft.customer_type !== "org")) {
      setShowDraftNotice(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  /**
   * Restore draft data
   */
  const restoreDraft = () => {
    if (formDraft) {
      setFormData({
        name: formDraft.name,
        customer_type: formDraft.customer_type,
      });
      setShowDraftNotice(false);
      setHasDismissedDraft(true);
    }
  };

  /**
   * Dismiss draft notice and clear draft
   */
  const dismissDraft = () => {
    setShowDraftNotice(false);
    setHasDismissedDraft(true);
    clearFormDraft();
  };

  /**
   * Handles form submission
   * Creates a new customer via CustomerContext
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate parent org for sub-org type
    if (formData.customer_type === "sub-org" && !selectedParentOrg) {
      setError("Please select a parent organization for sub-organizations");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare customer data
      const customerData: any = {
        name: formData.name,
        customer_type: formData.customer_type,
      };

      // Add parent_org_id if this is a sub-org
      if (formData.customer_type === "sub-org" && selectedParentOrg) {
        customerData.parent_org_id = selectedParentOrg.id;
      }

      await addCustomer(customerData);
      
      // Clear form draft on successful submission
      clearFormDraft();
      
      setSuccess(true);
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
      setIsSubmitting(false);
    }
  };

  /**
   * Handles input changes and saves draft
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updated = {
      ...formData,
      [name]: value,
    };
    setFormData(updated);

    // Clear parent org selection if switching from sub-org to org
    if (name === "customer_type" && value === "org") {
      setSelectedParentOrg(null);
      setParentOrgSearch("");
    }
    
    // Only auto-save if user has dismissed or restored the draft notice
    // This prevents saving during initial page load
    if (hasDismissedDraft || !showDraftNotice) {
      // Auto-save draft after 500ms delay
      setTimeout(() => {
        saveFormDraft(updated);
      }, 500);
    }
  };

  /**
   * Handles parent organization selection
   */
  const handleSelectParentOrg = (org: Customer) => {
    setSelectedParentOrg(org);
    setParentOrgSearch(org.name);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Customer</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Add a new organization or sub-organization to your subscription portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Draft Notice */}
          {showDraftNotice && formDraft && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    You have an unsaved draft from earlier. Would you like to restore it?
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={restoreDraft}
                      className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
                    >
                      Restore Draft
                    </button>
                    <button
                      type="button"
                      onClick={dismissDraft}
                      className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                    Customer created successfully! Redirecting...
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

          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Customer Name <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white dark:bg-gray-700"
              placeholder="Enter customer name"
              disabled={isSubmitting || success}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The name of the organization or sub-organization
            </p>
          </div>

          {/* Customer Type Field */}
          <div>
            <label
              htmlFor="customer_type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Customer Type <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              id="customer_type"
              name="customer_type"
              required
              value={formData.customer_type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white dark:bg-gray-700"
              disabled={isSubmitting || success}
            >
              <option value="org">Organization</option>
              <option value="sub-org">Sub-Organization</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Organization:</span> A primary business entity.{" "}
              <span className="font-medium">Sub-Organization:</span> A division or subsidiary of a parent organization.
            </p>
          </div>

          {/* Parent Organization Field - Only shown for sub-org */}
          {formData.customer_type === "sub-org" && (
            <div>
              <label
                htmlFor="parent_org"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Parent Organization <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <CustomerAutocomplete
                customers={organizations}
                value={parentOrgSearch}
                onChange={setParentOrgSearch}
                onSelectCustomer={handleSelectParentOrg}
              />
              {selectedParentOrg && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-green-600 dark:text-green-400">
                    ✓ Selected: {selectedParentOrg.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParentOrg(null);
                      setParentOrgSearch("");
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                  >
                    Clear
                  </button>
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Search and select the parent organization that this sub-organization belongs to.
              </p>
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
                  Creating...
                </>
              ) : (
                "Create Customer"
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
          About Customer Types
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>
            <strong>Organizations</strong> are independent business entities that use your subscription platform
          </li>
          <li>
            <strong>Sub-Organizations</strong> are departments or subsidiaries linked to a parent organization
          </li>
          <li>
            Both types can have their own Stripe subscriptions and payment methods
          </li>
        </ul>
      </div>
    </div>
  );
}

