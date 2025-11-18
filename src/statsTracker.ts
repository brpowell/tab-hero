import * as vscode from "vscode";

export interface SessionStats {
  score: number;
  tabs: number;
  startTime: number;
  tpm: number;
  rank: string;
}

export interface AllTimeStats {
  score: number;
  tabs: number;
  highestTPM: number;
  highestRank: string;
}

export interface StatsUpdateCallback {
  (sessionStats: SessionStats, allTimeStats: AllTimeStats): void;
}

/**
 * Tracks tab hero statistics for both session and all-time.
 * Session stats reset on VS Code restart, all-time stats persist.
 */
export class StatsTracker {
  private context: vscode.ExtensionContext;
  private sessionScore: number = 0;
  private sessionTabs: number = 0;
  private sessionStartTime: number = Date.now();
  private updateCallbacks: StatsUpdateCallback[] = [];

  // Guitar Hero-inspired rank thresholds with campy rank names
  private readonly RANK_THRESHOLDS = [
    { name: "Roadie", min: 0 },
    { name: "Rhythm Rookie", min: 501 },
    { name: "Tab Warrior", min: 1001 },
    { name: "Expert", min: 2001 },
    { name: "Combo King", min: 5001 },
    { name: "Shredder", min: 10001 },
    { name: "Tab Hero", min: 25001 },
    { name: "Tab Legend", min: 50000 },
  ];

  private readonly ALL_TIME_STATS_KEY = "tabHero.allTimeStats";

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.resetSession();
  }

  /**
   * Reset session stats (called on activation)
   */
  resetSession(): void {
    this.sessionScore = 0;
    this.sessionTabs = 0;
    this.sessionStartTime = Date.now();
    this.notifyCallbacks();
  }

  /**
   * Add score for a completed tab completion
   */
  addScore(score: number): void {
    this.sessionScore += score;
    this.sessionTabs += 1;

    // Calculate current TPM and rank
    const currentTPM = this.calculateTPM();
    const currentRank = this.getRank(this.sessionScore);

    // Update all-time stats
    const allTimeStats = this.getAllTimeStats();
    allTimeStats.score += score;
    allTimeStats.tabs += 1;

    // Update highest TPM if current is higher
    if (currentTPM > allTimeStats.highestTPM) {
      allTimeStats.highestTPM = currentTPM;
    }

    // Update highest rank if current is higher
    if (this.isRankHigher(currentRank, allTimeStats.highestRank)) {
      allTimeStats.highestRank = currentRank;
    }

    this.saveAllTimeStats(allTimeStats);

    this.notifyCallbacks();
  }

  /**
   * Get current session stats
   */
  getSessionStats(): SessionStats {
    const tpm = this.calculateTPM();
    const rank = this.getRank(this.sessionScore);

    return {
      score: this.sessionScore,
      tabs: this.sessionTabs,
      startTime: this.sessionStartTime,
      tpm: tpm,
      rank: rank,
    };
  }

  /**
   * Get all-time stats from persistent storage
   */
  getAllTimeStats(): AllTimeStats {
    const stored = this.context.globalState.get<AllTimeStats>(
      this.ALL_TIME_STATS_KEY
    );
    // Ensure all fields exist even if stored data doesn't have them (for backward compatibility)
    if (stored) {
      // If highestRank doesn't exist, calculate it from the current score
      const highestRank = stored.highestRank || this.getRank(stored.score || 0);

      return {
        score: stored.score || 0,
        tabs: stored.tabs || 0,
        highestTPM: stored.highestTPM ?? 0,
        highestRank: highestRank,
      };
    }
    return {
      score: 0,
      tabs: 0,
      highestTPM: 0,
      highestRank: this.RANK_THRESHOLDS[0].name,
    };
  }

  /**
   * Save all-time stats to persistent storage
   */
  private saveAllTimeStats(stats: AllTimeStats): void {
    this.context.globalState.update(this.ALL_TIME_STATS_KEY, stats);
  }

  /**
   * Calculate tabs per minute (TPM) for current session
   */
  calculateTPM(): number {
    if (this.sessionTabs === 0) {
      return 0;
    }

    const elapsedMinutes = (Date.now() - this.sessionStartTime) / (1000 * 60);
    if (elapsedMinutes === 0) {
      return this.sessionTabs; // If less than a minute, return tabs as TPM
    }

    return Math.round((this.sessionTabs / elapsedMinutes) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get rank based on score (Guitar Hero-inspired)
   */
  getRank(score: number): string {
    // Find the highest rank threshold the score meets
    for (let i = this.RANK_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= this.RANK_THRESHOLDS[i].min) {
        return this.RANK_THRESHOLDS[i].name;
      }
    }
    return this.RANK_THRESHOLDS[0].name; // Default to Roadie
  }

  /**
   * Check if rank1 is higher than rank2
   */
  private isRankHigher(rank1: string, rank2: string): boolean {
    const getRankIndex = (rank: string): number => {
      const index = this.RANK_THRESHOLDS.findIndex((r) => r.name === rank);
      return index >= 0 ? index : 0;
    };

    return getRankIndex(rank1) > getRankIndex(rank2);
  }

  /**
   * Register a callback to be notified when stats change
   */
  onStatsUpdate(callback: StatsUpdateCallback): vscode.Disposable {
    this.updateCallbacks.push(callback);
    // Immediately call with current stats
    callback(this.getSessionStats(), this.getAllTimeStats());

    return new vscode.Disposable(() => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    });
  }

  /**
   * Notify all registered callbacks of stats updates
   */
  private notifyCallbacks(): void {
    const sessionStats = this.getSessionStats();
    const allTimeStats = this.getAllTimeStats();

    for (const callback of this.updateCallbacks) {
      try {
        callback(sessionStats, allTimeStats);
      } catch (error) {
        console.error("Error in stats update callback:", error);
      }
    }
  }
}
