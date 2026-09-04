import { create } from "zustand";

interface SearchLimitState {
  searchCount: number;
  firstLimitReachedAt: number | null;
  isLocked: boolean;
  countdownRemaining: number;
  userEmail: string | null;

  // Actions
  initializeForUser: (userEmail: string | null, currentPlan?: string) => void;
  recordSuccessfulSearch: (userEmail: string | null, currentPlan?: string) => { 
    count: number; 
    reachedLimit: boolean; 
    startsCountdown: boolean 
  };
  checkLockStatus: (userEmail: string | null, currentPlan?: string) => boolean;
  decrementCountdown: () => void;
  unlockWithPlan: (planKey: string) => void;
  resetForTesting: () => void;
}

const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds
const SEARCH_LIMIT = 3;

function getStorageKey(userEmail: string | null): string {
  const safeId = userEmail ? userEmail.toLowerCase().replace(/[^a-z0-9]/g, "_") : "anonymous";
  return `globalreach_search_limit_${safeId}`;
}

interface StoredLimitData {
  searchCount: number;
  firstLimitReachedAt: number | null;
  isLocked: boolean;
  unlockedPlan?: string | null;
}

function loadFromStorage(userEmail: string | null): StoredLimitData {
  if (typeof window === "undefined") {
    return { searchCount: 0, firstLimitReachedAt: null, isLocked: false };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(userEmail));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return { searchCount: 0, firstLimitReachedAt: null, isLocked: false };
}

function saveToStorage(userEmail: string | null, data: StoredLimitData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(data));
  } catch {
    // fallback
  }
}

export const useSearchLimitStore = create<SearchLimitState>((set, get) => ({
  searchCount: 0,
  firstLimitReachedAt: null,
  isLocked: false,
  countdownRemaining: 30,
  userEmail: null,

  initializeForUser: (userEmail: string | null, currentPlan?: string) => {
    // Paid plan bypasses all search limits
    if (currentPlan && currentPlan !== "free") {
      set({
        userEmail,
        searchCount: 0,
        firstLimitReachedAt: null,
        isLocked: false,
        countdownRemaining: 30,
      });
      return;
    }

    const stored = loadFromStorage(userEmail);

    // If already marked as unlocked through paid plan
    if (stored.unlockedPlan && stored.unlockedPlan !== "free") {
      set({
        userEmail,
        searchCount: 0,
        firstLimitReachedAt: null,
        isLocked: false,
        countdownRemaining: 30,
      });
      return;
    }

    let isLocked = stored.isLocked;
    let countdownRemaining = 30;

    // Check if 3 searches were reached previously
    if (stored.searchCount >= SEARCH_LIMIT && stored.firstLimitReachedAt) {
      const elapsed = Date.now() - stored.firstLimitReachedAt;
      if (elapsed >= GRACE_PERIOD_MS || stored.isLocked) {
        // Exceeded 30 seconds -> lock immediately upon login
        isLocked = true;
        countdownRemaining = 0;
      } else {
        // Still within 30-second grace countdown
        isLocked = false;
        countdownRemaining = Math.max(0, Math.ceil((GRACE_PERIOD_MS - elapsed) / 1000));
      }
    }

    set({
      userEmail,
      searchCount: stored.searchCount,
      firstLimitReachedAt: stored.firstLimitReachedAt,
      isLocked,
      countdownRemaining,
    });

    saveToStorage(userEmail, {
      searchCount: stored.searchCount,
      firstLimitReachedAt: stored.firstLimitReachedAt,
      isLocked,
    });
  },

  recordSuccessfulSearch: (userEmail: string | null, currentPlan?: string) => {
    // If paid plan, never limit
    if (currentPlan && currentPlan !== "free") {
      return { count: 0, reachedLimit: false, startsCountdown: false };
    }

    const currentCount = get().searchCount;
    const newCount = currentCount + 1;
    let reachedLimit = false;
    let startsCountdown = false;
    let firstLimitReachedAt = get().firstLimitReachedAt;
    let isLocked = get().isLocked;
    let countdownRemaining = get().countdownRemaining;

    if (newCount >= SEARCH_LIMIT) {
      reachedLimit = true;
      if (!firstLimitReachedAt) {
        firstLimitReachedAt = Date.now();
        startsCountdown = true;
        countdownRemaining = 30;
      } else {
        const elapsed = Date.now() - firstLimitReachedAt;
        if (elapsed >= GRACE_PERIOD_MS) {
          isLocked = true;
          countdownRemaining = 0;
        } else {
          countdownRemaining = Math.max(0, Math.ceil((GRACE_PERIOD_MS - elapsed) / 1000));
        }
      }
    }

    set({
      searchCount: newCount,
      firstLimitReachedAt,
      isLocked,
      countdownRemaining,
    });

    saveToStorage(userEmail || get().userEmail, {
      searchCount: newCount,
      firstLimitReachedAt,
      isLocked,
    });

    return { count: newCount, reachedLimit, startsCountdown };
  },

  checkLockStatus: (userEmail: string | null, currentPlan?: string) => {
    if (currentPlan && currentPlan !== "free") {
      if (get().isLocked) {
        set({ isLocked: false });
      }
      return false;
    }

    const { searchCount, firstLimitReachedAt } = get();
    if (searchCount >= SEARCH_LIMIT && firstLimitReachedAt) {
      const elapsed = Date.now() - firstLimitReachedAt;
      if (elapsed >= GRACE_PERIOD_MS) {
        set({ isLocked: true, countdownRemaining: 0 });
        saveToStorage(userEmail || get().userEmail, {
          searchCount,
          firstLimitReachedAt,
          isLocked: true,
        });
        return true;
      }
    }
    return get().isLocked;
  },

  decrementCountdown: () => {
    const { countdownRemaining, isLocked, searchCount, userEmail, firstLimitReachedAt } = get();
    if (isLocked) return;

    if (searchCount >= SEARCH_LIMIT && firstLimitReachedAt) {
      const newRemaining = countdownRemaining - 1;
      if (newRemaining <= 0) {
        set({ countdownRemaining: 0, isLocked: true });
        saveToStorage(userEmail, {
          searchCount,
          firstLimitReachedAt,
          isLocked: true,
        });
      } else {
        set({ countdownRemaining: newRemaining });
      }
    }
  },

  unlockWithPlan: (planKey: string) => {
    const userEmail = get().userEmail;
    set({
      searchCount: 0,
      firstLimitReachedAt: null,
      isLocked: false,
      countdownRemaining: 30,
    });

    saveToStorage(userEmail, {
      searchCount: 0,
      firstLimitReachedAt: null,
      isLocked: false,
      unlockedPlan: planKey,
    });
  },

  resetForTesting: () => {
    const userEmail = get().userEmail;
    set({
      searchCount: 0,
      firstLimitReachedAt: null,
      isLocked: false,
      countdownRemaining: 30,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem(getStorageKey(userEmail));
    }
  },
}));
