// Storage utility for persisting bet data to localStorage

import type { PrizePickLineup } from "./prizepick-parser";

export interface StoredBet {
  id: string;
  sport: string;
  team: string;
  odds: string;
  stake: number;
  result: "win" | "loss" | "pending" | "refund" | "push" | "cancelled" | "void";
  payout?: number;
  date: string;
  createdAt: string;
  updatedAt: string;
  // Optional detailed data for PrizePick lineups
  prizePickDetails?: PrizePickLineup;
}

const STORAGE_KEY = "pot-of-greed-bets";
const STORAGE_VERSION = "1.0";

export class BetStorage {
  private static instance: BetStorage;

  static getInstance(): BetStorage {
    if (!BetStorage.instance) {
      BetStorage.instance = new BetStorage();
    }
    return BetStorage.instance;
  }

  // Save bets to localStorage
  saveBets(bets: StoredBet[]): void {
    try {
      const storageData = {
        version: STORAGE_VERSION,
        timestamp: new Date().toISOString(),
        bets: bets.map((bet) => ({
          ...bet,
          updatedAt: new Date().toISOString(),
        })),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
      console.log(`Saved ${bets.length} bets to localStorage`);
    } catch (error) {
      console.error("Failed to save bets to localStorage:", error);
      // Handle storage quota exceeded or other errors
    }
  }

  // Load bets from localStorage
  loadBets(): StoredBet[] {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);

      if (!storedData) {
        console.log("No stored bets found");
        return [];
      }

      const parsedData = JSON.parse(storedData);

      // Version check for future migrations
      if (parsedData.version !== STORAGE_VERSION) {
        console.warn("Storage version mismatch, running migration...");
        return this.migrateBets(parsedData);
      }

      console.log(
        `Loaded ${parsedData.bets?.length || 0} bets from localStorage`,
      );
      return parsedData.bets || [];
    } catch (error) {
      console.error("Failed to load bets from localStorage:", error);
      return [];
    }
  }

  // Add a single bet
  addBet(bet: Omit<StoredBet, "createdAt" | "updatedAt">): StoredBet[] {
    const existingBets = this.loadBets();
    const newBet: StoredBet = {
      ...bet,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedBets = [...existingBets, newBet];
    this.saveBets(updatedBets);
    return updatedBets;
  }

  // Update an existing bet
  updateBet(betId: string, updates: Partial<StoredBet>): StoredBet[] {
    const existingBets = this.loadBets();
    const updatedBets = existingBets.map((bet) =>
      bet.id === betId
        ? { ...bet, ...updates, updatedAt: new Date().toISOString() }
        : bet,
    );

    this.saveBets(updatedBets);
    return updatedBets;
  }

  // Delete a bet
  deleteBet(betId: string): StoredBet[] {
    const existingBets = this.loadBets();
    const filteredBets = existingBets.filter((bet) => bet.id !== betId);

    this.saveBets(filteredBets);
    return filteredBets;
  }

  // Add multiple bets (for imports)
  addBets(newBets: Omit<StoredBet, "createdAt" | "updatedAt">[]): StoredBet[] {
    const existingBets = this.loadBets();
    const timestamp = new Date().toISOString();

    const beatsWithTimestamps: StoredBet[] = newBets.map((bet) => ({
      ...bet,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const updatedBets = [...existingBets, ...beatsWithTimestamps];
    this.saveBets(updatedBets);
    return updatedBets;
  }

  // Clear all data
  clearAllBets(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log("Cleared all betting data");
    } catch (error) {
      console.error("Failed to clear betting data:", error);
    }
  }

  // Export data (for backup)
  exportData(): string {
    const bets = this.loadBets();
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
      bets,
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import data (from backup)
  importData(jsonData: string): StoredBet[] {
    try {
      const importedData = JSON.parse(jsonData);

      if (importedData.bets && Array.isArray(importedData.bets)) {
        this.saveBets(importedData.bets);
        return importedData.bets;
      } else {
        throw new Error("Invalid import data format");
      }
    } catch (error) {
      console.error("Failed to import data:", error);
      throw error;
    }
  }

  // Get storage statistics
  getStorageStats(): {
    totalBets: number;
    totalStake: number;
    totalWon: number;
    totalLost: number;
    storageSize: string;
  } {
    const bets = this.loadBets();
    const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalWon = bets
      .filter((bet) => bet.result === "win")
      .reduce((sum, bet) => sum + (bet.payout || 0), 0);
    const totalLost = bets
      .filter((bet) => bet.result === "loss")
      .reduce((sum, bet) => sum + bet.stake, 0);
    const totalRefunded = bets
      .filter(
        (bet) =>
          bet.result === "refund" ||
          bet.result === "push" ||
          bet.result === "void",
      )
      .reduce((sum, bet) => sum + bet.stake, 0);

    // Calculate storage size
    const storedData = localStorage.getItem(STORAGE_KEY);
    const storageSize = storedData
      ? `${(new Blob([storedData]).size / 1024).toFixed(2)} KB`
      : "0 KB";

    return {
      totalBets: bets.length,
      totalStake,
      totalWon,
      totalLost,
      storageSize,
    };
  }

  // Migration function for future versions
  private migrateBets(oldData: any): StoredBet[] {
    // For now, just return empty array for unsupported versions
    // In the future, add migration logic here
    console.warn("Data migration not implemented for this version");
    return [];
  }
}

// Export singleton instance
export const betStorage = BetStorage.getInstance();

// Helper functions for React components
export const useBetStorage = () => {
  return {
    saveBets: (bets: StoredBet[]) => betStorage.saveBets(bets),
    loadBets: () => betStorage.loadBets(),
    addBet: (bet: Omit<StoredBet, "createdAt" | "updatedAt">) =>
      betStorage.addBet(bet),
    updateBet: (id: string, updates: Partial<StoredBet>) =>
      betStorage.updateBet(id, updates),
    deleteBet: (id: string) => betStorage.deleteBet(id),
    addBets: (bets: Omit<StoredBet, "createdAt" | "updatedAt">[]) =>
      betStorage.addBets(bets),
    clearAll: () => betStorage.clearAllBets(),
    exportData: () => betStorage.exportData(),
    importData: (data: string) => betStorage.importData(data),
    getStats: () => betStorage.getStorageStats(),
  };
};
