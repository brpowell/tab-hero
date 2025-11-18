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

  resetSession(): void {
    this.sessionScore = 0;
    this.sessionTabs = 0;
    this.sessionStartTime = Date.now();
    this.notifyCallbacks();
  }

  addScore(score: number): void {
    this.sessionScore += score;
    this.sessionTabs += 1;

    const currentTPM = this.calculateTPM();
    const currentRank = this.getRank(this.sessionScore);

    const allTimeStats = this.getAllTimeStats();
    allTimeStats.score += score;
    allTimeStats.tabs += 1;

    if (currentTPM > allTimeStats.highestTPM) {
      allTimeStats.highestTPM = currentTPM;
    }

    if (this.isRankHigher(currentRank, allTimeStats.highestRank)) {
      allTimeStats.highestRank = currentRank;
    }

    this.saveAllTimeStats(allTimeStats);

    this.notifyCallbacks();
  }

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

  getAllTimeStats(): AllTimeStats {
    const stored = this.context.globalState.get<AllTimeStats>(
      this.ALL_TIME_STATS_KEY
    );
    if (stored) {
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

  private saveAllTimeStats(stats: AllTimeStats): void {
    this.context.globalState.update(this.ALL_TIME_STATS_KEY, stats);
  }

  calculateTPM(): number {
    if (this.sessionTabs === 0) {
      return 0;
    }

    const elapsedMinutes = (Date.now() - this.sessionStartTime) / (1000 * 60);
    if (elapsedMinutes === 0) {
      return this.sessionTabs;
    }

    return Math.round((this.sessionTabs / elapsedMinutes) * 10) / 10;
  }

  getRank(score: number): string {
    for (let i = this.RANK_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= this.RANK_THRESHOLDS[i].min) {
        return this.RANK_THRESHOLDS[i].name;
      }
    }
    return this.RANK_THRESHOLDS[0].name; // Default to Roadie
  }

  private isRankHigher(rank1: string, rank2: string): boolean {
    const getRankIndex = (rank: string): number => {
      const index = this.RANK_THRESHOLDS.findIndex((r) => r.name === rank);
      return index >= 0 ? index : 0;
    };

    return getRankIndex(rank1) > getRankIndex(rank2);
  }

  onStatsUpdate(callback: StatsUpdateCallback): vscode.Disposable {
    this.updateCallbacks.push(callback);
    callback(this.getSessionStats(), this.getAllTimeStats());

    return new vscode.Disposable(() => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    });
  }

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
