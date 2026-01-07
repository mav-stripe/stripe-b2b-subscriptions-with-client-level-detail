"use client";

import React, { useState, useEffect } from "react";
import { useCustomers, Customer } from "./contexts/CustomerContext";
import { useApp } from "./contexts/AppContext";
import CustomerAutocomplete from "./components/CustomerAutocomplete";

/**
 * Overall stats type
 */
interface OverallStats {
  totalOrgs: number;
  totalSubOrgs: number;
  totalClients: number;
  totalActiveClients: number;
  totalPausedClients: number;
}

/**
 * Homepage component
 * Displays a list of customers and quick access to main features
 * Uses CustomerContext for state management
 */
export default function Home() {
  const { customers, loading, error } = useCustomers();
  const { searchQuery, setSearchQuery } = useApp();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<OverallStats>({
    totalOrgs: 0,
    totalSubOrgs: 0,
    totalClients: 0,
    totalActiveClients: 0,
    totalPausedClients: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    // Add null safety checks
    if (!customer || !customer.name) return false;
    
    // If no search query, show all
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    // Check if customer name matches
    const customerNameMatches = customer.name.toLowerCase().includes(searchLower);
    
    // Check if any sub-org name matches
    const subOrgMatches = customer.suborgs?.some(
      (suborg) => suborg.name?.toLowerCase().includes(searchLower)
    ) || false;
    
    // Match if either customer name or any sub-org name matches
    return customerNameMatches || subOrgMatches;
  });

  // Create flattened list of all customers including sub-orgs for autocomplete
  // Add parent_org_name to sub-orgs for display purposes
  const allCustomersFlattened = customers.reduce<(Customer & { uniqueKey?: string })[]>((acc, customer) => {
    // Add the main customer with unique key
    acc.push({
      ...customer,
      uniqueKey: `org-${customer.id}`,
    });
    
    // Add all sub-orgs with parent org name attached
    if (customer.suborgs && customer.suborgs.length > 0) {
      const subOrgsWithParent = customer.suborgs.map((suborg, index) => ({
        ...suborg,
        parent_org_name: customer.name, // Add parent name for display
        uniqueKey: `suborg-${customer.id}-${suborg.id || index}`, // Ensure unique key
      }));
      acc.push(...subOrgsWithParent);
    }
    
    return acc;
  }, []);

  // Fetch overall stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        
        const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_GET_STATS;
        
        if (!webhookUrl) {
          console.warn('NEXT_PUBLIC_WEBHOOK_GET_STATS is not configured');
          setStatsLoading(false);
          return;
        }

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'overall_stats' }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }
        
        let data = await response.json();
        
        // Handle array response format
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }
        
        setStats({
          totalOrgs: data.totalOrgs || 0,
          totalSubOrgs: data.totalSubOrgs || 0,
          totalClients: data.totalClients || 0,
          totalActiveClients: data.totalActiveClients || 0,
          totalPausedClients: data.totalPausedClients || 0,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Handle selecting a customer from autocomplete
  const handleSelectCustomer = (customer: Customer) => {
    // Optionally navigate to customer detail page when implemented
    console.log("Selected customer:", customer);
  };

  // Toggle row expansion
  const toggleRowExpansion = (customerId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Total Orgs
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {statsLoading ? '-' : stats.totalOrgs}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Total Sub-Orgs
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {statsLoading ? '-' : stats.totalSubOrgs}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Total Clients
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {statsLoading ? '-' : stats.totalClients}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Active Clients
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {statsLoading ? '-' : stats.totalActiveClients}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Paused Clients
          </div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {statsLoading ? '-' : stats.totalPausedClients}
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div id="customers" className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customers</h2>
            
            {/* Search Controls */}
            <div className="flex-1 sm:max-w-md">
              <CustomerAutocomplete
                customers={allCustomersFlattened}
                value={searchQuery}
                onChange={setSearchQuery}
                onSelectCustomer={handleSelectCustomer}
              />
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading customers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : filteredCustomers.length === 0 && customers.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No customers
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new customer.
              </p>
              <div className="mt-6">
                <a
                  href="/customer-create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Create Customer
                </a>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No customers match your search or filter criteria.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-8">
                      {/* Expand column */}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Parent Org
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Clients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map((customer) => {
                    const isExpanded = expandedRows.has(customer.id);
                    const hasSubOrgs = customer.suborgs && customer.suborgs.length > 0;

                    return (
                      <React.Fragment key={customer.id}>
                        {/* Main Row */}
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {/* Expand Icon with Count */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            {hasSubOrgs ? (
                              <button
                                onClick={() => toggleRowExpansion(customer.id)}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                              >
                                <span className="text-xs font-medium">
                                  {customer.suborgs!.length} {customer.suborgs!.length === 1 ? 'org' : 'orgs'}
                                </span>
                                <svg
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    isExpanded ? "rotate-90" : ""
                                  }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            ) : (
                              <div className="w-5"></div>
                            )}
                          </td>
                          
                          {/* Parent Org - Empty for top-level orgs */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.customer_type === "sub-org" ? (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {/* Would show parent org name here if we had it */}
                                -
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 dark:text-gray-600">-</div>
                            )}
                          </td>
                          
                          {/* Customer Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.name}
                            </div>
                          </td>
                          
                          {/* Type */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              customer.customer_type === "org"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}>
                              {customer.customer_type}
                            </span>
                          </td>
                          
                          {/* Clients Count */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                            {customer.client_count || 0}
                          </td>
                          
                          {/* Created Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(customer.created * 1000).toLocaleDateString()}
                          </td>
                          
                          {/* Actions - org type has no actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-400 dark:text-gray-600">
                            -
                          </td>
                        </tr>

                        {/* Expanded Sub-Orgs Rows */}
                        {isExpanded && hasSubOrgs && customer.suborgs!.map((suborg, index) => (
                          <tr key={`${customer.id}-suborg-${suborg.id || index}`} className="bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800">
                            {/* Empty cell for expand column */}
                            <td className="px-4 py-3"></td>
                            
                            {/* Parent Org Name */}
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                                ↳ {customer.name}
                              </div>
                            </td>
                            
                            {/* Sub-Org Name */}
                            <td className="px-6 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {suborg.name}
                              </div>
                            </td>
                            
                            {/* Type */}
                            <td className="px-6 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                sub-org
                              </span>
                            </td>
                            
                            {/* Clients Count */}
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                              {suborg.client_count || 0}
                            </td>
                            
                            {/* Created Date */}
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {suborg.created ? new Date(suborg.created * 1000).toLocaleDateString() : '-'}
                            </td>
                            
                            {/* Actions */}
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                              <a
                                href={`/clients-view?suborg=${suborg.id}&name=${encodeURIComponent(suborg.name)}&parent=${encodeURIComponent(customer.name)}`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                View Clients
                              </a>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
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

