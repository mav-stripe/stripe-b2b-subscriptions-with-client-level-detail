"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * App preferences and state
 */
interface AppPreferences {
  itemsPerPage: number;
  defaultCustomerType: "org" | "sub-org";
  showWelcomeMessage: boolean;
}

/**
 * Form draft data for customer creation
 */
interface FormDraft {
  name: string;
  customer_type: "org" | "sub-org";
  timestamp: number;
}

/**
 * App context type
 */
interface AppContextType {
  preferences: AppPreferences;
  updatePreferences: (updates: Partial<AppPreferences>) => void;
  formDraft: FormDraft | null;
  saveFormDraft: (draft: Omit<FormDraft, "timestamp">) => void;
  clearFormDraft: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: "all" | "org" | "sub-org";
  setFilterType: (type: "all" | "org" | "sub-org") => void;
}

/**
 * Create the App Context
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Local storage keys
 */
const PREFERENCES_KEY = "b2b-portal-preferences";
const FORM_DRAFT_KEY = "b2b-portal-form-draft";

/**
 * Default preferences
 */
const DEFAULT_PREFERENCES: AppPreferences = {
  itemsPerPage: 10,
  defaultCustomerType: "org",
  showWelcomeMessage: true,
};

/**
 * App Context Provider
 * Manages app-wide state and preferences with localStorage persistence
 */
export function AppProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "org" | "sub-org">("all");

  /**
   * Load preferences from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (err) {
      console.error("Failed to load preferences from localStorage:", err);
    }
  }, []);

  /**
   * Load form draft from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FORM_DRAFT_KEY);
      if (stored) {
        const parsed: FormDraft = JSON.parse(stored);
        // Only restore if draft is less than 24 hours old
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          setFormDraft(parsed);
        } else {
          localStorage.removeItem(FORM_DRAFT_KEY);
        }
      }
    } catch (err) {
      console.error("Failed to load form draft from localStorage:", err);
    }
  }, []);

  /**
   * Update preferences and save to localStorage
   */
  const updatePreferences = (updates: Partial<AppPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save preferences to localStorage:", err);
      }
      return updated;
    });
  };

  /**
   * Save form draft to localStorage
   */
  const saveFormDraft = (draft: Omit<FormDraft, "timestamp">) => {
    const draftWithTimestamp: FormDraft = {
      ...draft,
      timestamp: Date.now(),
    };
    setFormDraft(draftWithTimestamp);
    try {
      localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draftWithTimestamp));
    } catch (err) {
      console.error("Failed to save form draft to localStorage:", err);
    }
  };

  /**
   * Clear form draft from state and localStorage
   */
  const clearFormDraft = () => {
    setFormDraft(null);
    try {
      localStorage.removeItem(FORM_DRAFT_KEY);
    } catch (err) {
      console.error("Failed to clear form draft from localStorage:", err);
    }
  };

  const value: AppContextType = {
    preferences,
    updatePreferences,
    formDraft,
    saveFormDraft,
    clearFormDraft,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Custom hook to use the App Context
 * @throws Error if used outside of AppProvider
 */
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

