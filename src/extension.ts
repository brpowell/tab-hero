import * as vscode from "vscode";
import { CompletionDetector } from "./completionDetector";
import { ScoreCalculator } from "./scoreCalculator";
import { ScoreAnimation } from "./scoreAnimation";
import { onConfigChange } from "./config";

let completionDetector: CompletionDetector | undefined;
let scoreCalculator: ScoreCalculator | undefined;
let scoreAnimation: ScoreAnimation | undefined;
let disposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
  console.log("Tab Hero extension is now active!");

  completionDetector = new CompletionDetector();
  scoreCalculator = new ScoreCalculator();
  scoreAnimation = new ScoreAnimation();

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
    // Reinitialize components to pick up new config
    if (scoreCalculator) {
      scoreCalculator = new ScoreCalculator();
    }
    if (scoreAnimation) {
      scoreAnimation = new ScoreAnimation();
    }
  });
  context.subscriptions.push(configDisposable);

  disposables.push(...context.subscriptions);

  vscode.window.showInformationMessage(
    "Tab Hero is ready! Accept tab completions to see score animations."
  );
}

function handleCompletionAccepted(event: {
  text: string;
  position: vscode.Position;
  document: vscode.TextDocument;
}) {
  if (!scoreCalculator || !scoreAnimation) {
    return;
  }

  const scoreResult = scoreCalculator.calculateScore(event.text);

  scoreAnimation.showScore({
    position: event.position,
    score: scoreResult.score,
    document: event.document,
  });
}

export function deactivate() {
  if (scoreAnimation) {
    scoreAnimation.dispose();
  }

  disposables.forEach((disposable) => disposable.dispose());
  disposables = [];
}
