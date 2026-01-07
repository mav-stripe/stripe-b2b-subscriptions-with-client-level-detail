"use client";

import { useState, useRef, useEffect } from "react";
import { Customer } from "../contexts/CustomerContext";

interface CustomerAutocompleteProps {
  customers: Customer[];
  value: string;
  onChange: (value: string) => void;
  onSelectCustomer?: (customer: Customer) => void;
}

/**
 * Autocomplete search component for customers
 * Shows dropdown suggestions as user types
 */
export default function CustomerAutocomplete({
  customers,
  value,
  onChange,
  onSelectCustomer,
}: CustomerAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter customers based on search query
  // Also match parent org name if it exists
  const suggestions = customers.filter((customer) => {
    if (!customer?.name) return false;
    
    const searchLower = value.toLowerCase();
    const nameMatches = customer.name.toLowerCase().includes(searchLower);
    
    // Also check if parent org name matches (for sub-orgs)
    const parentMatches = customer.parent_org_name 
      ? customer.parent_org_name.toLowerCase().includes(searchLower)
      : false;
    
    return nameMatches || parentMatches;
  }).slice(0, 8); // Limit to 8 suggestions


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (customer: Customer) => {
    onChange(customer.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && suggestions.length > 0 && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle input focus - show dropdown even when empty
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Clear search
  const handleClear = () => {
    onChange("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Show dropdown when focused and there are suggestions (even if no search value yet)
  const showDropdown = isOpen && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Search customers..."
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          autoComplete="off"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((customer, index) => {
            // Use uniqueKey if available, otherwise fallback to id with index
            const uniqueKey = (customer as any).uniqueKey || `${customer.id}-${index}`;
            
            return (
              <button
                key={uniqueKey}
                type="button"
                onClick={() => handleSelectSuggestion(customer)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  index === highlightedIndex
                    ? "bg-gray-100 dark:bg-gray-700"
                    : ""
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {customer.customer_type === "sub-org" && customer.parent_org_name ? (
                      <>
                        <span className="text-gray-500 dark:text-gray-400">{customer.parent_org_name}</span>
                        <span className="mx-1 text-gray-400 dark:text-gray-500">/</span>
                        <span>{customer.name}</span>
                      </>
                    ) : (
                      customer.name
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {customer.customer_type === "org" ? "Organization" : "Sub-Organization"}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    customer.customer_type === "org"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {customer.customer_type}
                </span>
              </div>
            </button>
            );
          })}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && value && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No customers found matching &quot;{value}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

