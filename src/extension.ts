import * as vscode from "vscode";
import { CompletionDetector } from "./completionDetector";
import { ScoreCalculator } from "./scoreCalculator";
import { ScoreAnimation } from "./scoreAnimation";
import { onConfigChange, getConfig } from "./config";
import { StatsTracker } from "./statsTracker";
import { StatsDashboard } from "./statsDashboard";

let completionDetector: CompletionDetector | undefined;
let scoreCalculator: ScoreCalculator | undefined;
let scoreAnimation: ScoreAnimation | undefined;
let statsTracker: StatsTracker | undefined;
let statsDashboard: StatsDashboard | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let disposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
  console.log("Tab Hero extension is now active!");

  completionDetector = new CompletionDetector();
  scoreCalculator = new ScoreCalculator();
  scoreAnimation = new ScoreAnimation();
  statsTracker = new StatsTracker(context);
  statsDashboard = new StatsDashboard();

  statsTracker.resetSession();

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "tabHero.showStats";
  statusBarItem.tooltip = "Click to view Tab Hero stats";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const showStatsCommand = vscode.commands.registerCommand(
    "tabHero.showStats",
    () => {
      if (statsDashboard && statsTracker) {
        const sessionStats = statsTracker.getSessionStats();
        const allTimeStats = statsTracker.getAllTimeStats();
        statsDashboard.createOrShow(context, sessionStats, allTimeStats);
      }
    }
  );
  context.subscriptions.push(showStatsCommand);

  const statsUpdateDisposable = statsTracker.onStatsUpdate(
    (sessionStats, allTimeStats) => {
      updateStatusBar(sessionStats);
      if (statsDashboard) {
        statsDashboard.updateContent(sessionStats, allTimeStats);
      }
    }
  );
  context.subscriptions.push(statsUpdateDisposable);

  const providerRegistration =
    vscode.languages.registerInlineCompletionItemProvider(
      { scheme: "*" }, // All file types
      completionDetector
    );
  context.subscriptions.push(providerRegistration);

  const completionDisposable = completionDetector.onCompletionAccepted(
    (event) => {
      handleCompletionAccepted(event);
    }
  );
  context.subscriptions.push(completionDisposable);

  const configDisposable = onConfigChange(() => {
    if (scoreCalculator) {
      scoreCalculator = new ScoreCalculator();
    }
    if (scoreAnimation) {
      scoreAnimation = new ScoreAnimation();
    }
    if (statsTracker) {
      const sessionStats = statsTracker.getSessionStats();
      updateStatusBar(sessionStats);
    }
  });
  context.subscriptions.push(configDisposable);

  disposables.push(...context.subscriptions);

  if (statsTracker) {
    const sessionStats = statsTracker.getSessionStats();
    updateStatusBar(sessionStats);
  }

  vscode.window.showInformationMessage(
    "Tab Hero is ready! Accept tab completions to see score animations."
  );
}

function handleCompletionAccepted(event: {
  text: string;
  position: vscode.Position;
  document: vscode.TextDocument;
}) {
  if (!scoreCalculator || !scoreAnimation || !statsTracker) {
    return;
  }

  const scoreResult = scoreCalculator.calculateScore(event.text);

  statsTracker.addScore(scoreResult.score);

  scoreAnimation.showScore({
    position: event.position,
    score: scoreResult.score,
    document: event.document,
  });
}

function updateStatusBar(sessionStats: { score: number; tabs: number }): void {
  if (!statusBarItem) {
    return;
  }

  const config = getConfig();
  const decoration = config.scoreDecoration || "🎯";

  statusBarItem.text = `${decoration} ${sessionStats.score.toLocaleString()} | Tabs: ${
    sessionStats.tabs
  }`;
}

export function deactivate() {
  if (scoreAnimation) {
    scoreAnimation.dispose();
  }

  if (statsDashboard) {
    statsDashboard.dispose();
  }

  disposables.forEach((disposable) => disposable.dispose());
  disposables = [];
}
