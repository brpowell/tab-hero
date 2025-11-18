import * as vscode from "vscode";

export interface TabHeroConfig {
  enabled: boolean;
  showInlineScoreAnimation: boolean;
  scoreCalculationMethod: "quality" | "fixed" | "random";
  fixedScore: number;
  baseScorePerChar: number;
  minScore: number;
  maxScore: number;
  randomMinScore: number;
  randomMaxScore: number;
  animationDuration: number;
  animationStyle: "floating" | "fade";
  scoreColor: string;
  scoreDecoration: string;
}

export function getConfig(): TabHeroConfig {
  const config = vscode.workspace.getConfiguration("tabHero");

  return {
    enabled: config.get<boolean>("enabled", true),
    showInlineScoreAnimation: config.get<boolean>(
      "showInlineScoreAnimation",
      true
    ),
    scoreCalculationMethod: config.get<"quality" | "fixed" | "random">(
      "scoreCalculationMethod",
      "quality"
    ),
    fixedScore: config.get<number>("fixedScore", 10),
    baseScorePerChar: config.get<number>("baseScorePerChar", 0.5),
    minScore: config.get<number>("minScore", 1),
    maxScore: config.get<number>("maxScore", 1000),
    randomMinScore: config.get<number>("randomMinScore", 5),
    randomMaxScore: config.get<number>("randomMaxScore", 100),
    animationDuration: config.get<number>("animationDuration", 1500),
    animationStyle: config.get<"floating" | "fade">(
      "animationStyle",
      "floating"
    ),
    scoreColor: config.get<string>("scoreColor", "#4CAF50"),
    scoreDecoration: config.get<string>("scoreDecoration", "🎯"),
  };
}

export function onConfigChange(callback: () => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("tabHero")) {
      callback();
    }
  });
}
