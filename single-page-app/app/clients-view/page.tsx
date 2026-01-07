"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Client type definition
 */
interface Client {
  id: string;
  name: string;
  customer_id: string;
  org_name: string;
  parent_org_id?: string;
  parent_org_name?: string;
  created?: number;
  // Stripe fields
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_subscription_status?: string;
}

/**
 * Clients view page component
 * Displays clients for a specific sub-organization
 * Expects ?suborg=ID in the URL
 */
export default function ClientsView() {
  const searchParams = useSearchParams();
  const suborgId = searchParams.get("suborg");
  const suborgName = searchParams.get("name") || "Sub-Organization";
  const parentOrgName = searchParams.get("parent") || "";
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /**
   * Fetch clients from webhook for specific sub-org
   */
  const fetchClients = async () => {
    if (!suborgId) {
      setError("No sub-organization specified. Please select a sub-org from the homepage.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_GET_CLIENTS;
      
      if (!webhookUrl) {
        console.warn('NEXT_PUBLIC_WEBHOOK_GET_CLIENTS is not configured');
        setClients([]);
        setLoading(false);
        return;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: suborgId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.statusText}`);
      }
      
      let data = await response.json();
      
      // Handle various response formats:
      // - Direct array: [...]
      // - Wrapped: { data: [...] }
      // - Array wrapped: [{ data: [...] }]
      if (Array.isArray(data) && data.length > 0 && data[0].data) {
        data = data[0].data;
      } else if (data && data.data && Array.isArray(data.data)) {
        data = data.data;
      }
      
      if (Array.isArray(data)) {
        const transformedClients = data.map((client: any) => ({
          id: String(client.id || client.Id),
          name: client.name || client.Name || "",
          customer_id: String(client.customer_id || client.customerId || client.CustomerId || ""),
          org_name: client.org_name || client.orgName || client.OrgName || "",
          parent_org_id: client.parent_org_id || client.parentOrgId || client.ParentOrgId,
          parent_org_name: client.parent_org_name || client.parentOrgName || client.ParentOrgName,
          created: client.created || 
            (client.CreatedAt ? new Date(client.CreatedAt).getTime() / 1000 : undefined),
          // Stripe fields
          stripe_customer_id: client.stripe_customer_id || client.stripeCustomerId,
          stripe_subscription_id: client.stripe_subscription_id || client.stripeSubscriptionId,
          stripe_subscription_status: client.stripe_subscription_status || client.stripeSubscriptionStatus,
        }));
        setClients(transformedClients);
      } else {
        setClients([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch clients";
      setError(message);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [suborgId]);

  /**
   * Pause subscription
   */
  const handlePauseSubscription = async (client: Client) => {
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_PAUSE_SUBSCRIPTION;
    if (!webhookUrl) {
      alert('Pause subscription webhook not configured');
      return;
    }

    setActionLoading(client.id);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: suborgId,
          stripe_subscription_id: client.stripe_subscription_id,
          db_status: "paused",
          stripe_status: "void",
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to pause subscription');
      }

      // Refresh the clients list
      await fetchClients();
    } catch (err) {
      console.error('Error pausing subscription:', err);
      alert('Failed to pause subscription');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Resume subscription
   */
  const handleResumeSubscription = async (client: Client) => {
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_RESUME_SUBSCRIPTION;
    if (!webhookUrl) {
      alert('Resume subscription webhook not configured');
      return;
    }

    setActionLoading(client.id);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: suborgId,
          stripe_subscription_id: client.stripe_subscription_id,
          db_status: "active",
          stripe_status: "",
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume subscription');
      }

      // Refresh the clients list
      await fetchClients();
    } catch (err) {
      console.error('Error resuming subscription:', err);
      alert('Failed to resume subscription');
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Get Stripe dashboard URL for subscription
   */
  const getStripeDashboardUrl = (client: Client) => {
    if (!client.stripe_subscription_id) {
      return null;
    }
    // Standard Stripe dashboard URL for subscriptions
    return `https://dashboard.stripe.com/test/subscriptions/${client.stripe_subscription_id}`;
  };

  /**
   * Get status badge color
   */
  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          {parentOrgName && (
            <>
              <a href="/" className="hover:text-blue-600 dark:hover:text-blue-400">{decodeURIComponent(parentOrgName)}</a>
              <span>/</span>
            </>
          )}
          <span>{decodeURIComponent(suborgName)}</span>
          <span>/</span>
          <span>Clients</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Clients for {parentOrgName ? `${decodeURIComponent(parentOrgName)} / ` : ''}{decodeURIComponent(suborgName)}
        </h1>
      </div>

      {/* Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Total Clients
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {clients.length}
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Clients</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading clients...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <a
                href="/"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                ← Back to Customers
              </a>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No clients yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This sub-organization doesn&apos;t have any clients yet.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <a
                  href={`/client-create?suborg=${suborgId}&name=${encodeURIComponent(suborgName)}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Create Client
                </a>
                <a
                  href={`/client-create-batch?suborg=${suborgId}&name=${encodeURIComponent(suborgName)}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Batch Create
                </a>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {clients.map((client, index) => {
                    const stripeUrl = getStripeDashboardUrl(client);
                    const isActionLoading = actionLoading === client.id;
                    
                    return (
                      <tr key={client.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(client.stripe_subscription_status)}`}>
                            {client.stripe_subscription_status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {client.created 
                            ? new Date(client.created * 1000).toLocaleDateString()
                            : "-"
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-3">
                            {/* Pause Button - only show for active subscriptions */}
                            {client.stripe_subscription_status === 'active' && (
                              <button
                                onClick={() => handlePauseSubscription(client)}
                                disabled={isActionLoading}
                                className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 disabled:opacity-50 transition-colors"
                                title="Pause the subscription"
                              >
                                {isActionLoading ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                            )}

                            {/* Resume Button - only show for paused subscriptions */}
                            {client.stripe_subscription_status === 'paused' && (
                              <button
                                onClick={() => handleResumeSubscription(client)}
                                disabled={isActionLoading}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 transition-colors"
                                title="Resume the subscription"
                              >
                                {isActionLoading ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                            )}

                            {/* Open in Stripe Dashboard */}
                            {stripeUrl ? (
                              <a
                                href={stripeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                title="Open in Stripe Dashboard"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600" title="No Stripe subscription">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
