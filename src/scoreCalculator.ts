import { TabHeroConfig, getConfig } from "./config";

export interface ScoreCalculationResult {
  score: number;
  method: string;
}

/**
 * Calculates score based on completion text using the configured method.
 */
export class ScoreCalculator {
  private config: TabHeroConfig;

  constructor() {
    this.config = getConfig();
  }

  /**
   * Calculate score for a given completion text.
   * @param completionText The text that was inserted as a completion
   * @returns The calculated score
   */
  calculateScore(completionText: string): ScoreCalculationResult {
    this.config = getConfig(); // Refresh config in case it changed

    let score: number;

    switch (this.config.scoreCalculationMethod) {
      case "quality":
        score = this.calculateQualityScore(completionText);
        break;
      case "fixed":
        score = this.calculateFixedScore();
        break;
      case "random":
        score = this.calculateRandomScore();
        break;
      default:
        score = this.calculateQualityScore(completionText);
    }

    score = Math.max(
      this.config.minScore,
      Math.min(this.config.maxScore, score)
    );

    return {
      score: Math.round(score),
      method: this.config.scoreCalculationMethod,
    };
  }

  /**
   * Calculate score based on completion quality (length, complexity, etc.)
   */
  private calculateQualityScore(text: string): number {
    if (!text || text.length === 0) {
      return this.config.minScore;
    }

    const charCount = text.length;
    const lineCount = (text.match(/\n/g) || []).length + 1;

    // Base score from character count
    let score = charCount * this.config.baseScorePerChar;

    // Bonus for multi-line completions (indicates more complex code)
    if (lineCount > 1) {
      score *= 1.2;
    }

    // Small bonus for completions with common code patterns
    const complexityIndicators = [
      /\{[\s\S]*\}/, // Contains blocks
      /\([\s\S]*\)/, // Contains function calls
      /\[[\s\S]*\]/, // Contains arrays
      /function|const|let|var|class|interface|type/, // Keywords
    ];

    const complexityBonus =
      complexityIndicators.filter((regex) => regex.test(text)).length * 2;
    score += complexityBonus;

    return score;
  }

  private calculateFixedScore(): number {
    return this.config.fixedScore;
  }

  private calculateRandomScore(): number {
    const range = this.config.randomMaxScore - this.config.randomMinScore;
    return this.config.randomMinScore + Math.random() * range;
  }
}
