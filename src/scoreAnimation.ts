import * as vscode from "vscode";
import { TabHeroConfig, getConfig } from "./config";

export interface AnimationOptions {
  position: vscode.Position;
  score: number;
  document: vscode.TextDocument;
}

interface ActiveAnimation {
  decorationType: vscode.TextEditorDecorationType;
  range: vscode.Range;
  startTime: number;
  scoreText: string;
  intervalId: NodeJS.Timeout;
  webviewPanel?: vscode.WebviewPanel;
  startPosition?: { x: number; y: number };
}

export class ScoreAnimation {
  private config: TabHeroConfig;
  private activeAnimations: Map<string, ActiveAnimation> = new Map();
  private animationCounter: number = 0;
  private readonly ANIMATION_UPDATE_INTERVAL = 16;

  constructor() {
    this.config = getConfig();
  }

  /**
   * Show a score animation at the given position
   */
  showScore(options: AnimationOptions): void {
    this.config = getConfig(); // Refresh config

    if (!this.config.enabled) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== options.document) {
      return;
    }

    const animationId = `tab-hero-${Date.now()}-${this.animationCounter++}`;
    const scoreText = `+${options.score}`;

    // Create decoration range at the cursor's final position after completion
    // This is where the cursor ends up after accepting the completion
    const range = new vscode.Range(
      options.position.line,
      options.position.character,
      options.position.line,
      options.position.character
    );

    const decorationType = this.createDecorationType();

    this.startAnimation(animationId, {
      decorationType,
      range,
      startTime: Date.now(),
      scoreText,
      intervalId: setInterval(() => {
        this.updateAnimation(animationId);
      }, this.ANIMATION_UPDATE_INTERVAL),
    });
  }

  private createDecorationType(): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      after: {
        contentText: "",
      },
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      isWholeLine: false,
    });
  }

  private startAnimation(id: string, animation: ActiveAnimation): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    this.updateAnimationDecoration(id, animation, 0, editor);

    this.activeAnimations.set(id, animation);
  }

  private updateAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (!animation) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this.cleanupAnimation(id);
      return;
    }

    const elapsed = Date.now() - animation.startTime;
    const progress = Math.min(elapsed / this.config.animationDuration, 1);

    if (progress >= 1) {
      this.cleanupAnimation(id);
      return;
    }

    this.updateAnimationDecoration(id, animation, progress, editor);
  }

  /**
   * Update the decoration based on animation progress
   */
  private updateAnimationDecoration(
    id: string,
    animation: ActiveAnimation,
    progress: number,
    editor: vscode.TextEditor
  ): void {
    // Simple fade out animation - no movement between lines to avoid jarring effect
    const opacity = 1 - progress;
    const baseColor = this.addOpacityToColor(this.config.scoreColor, opacity);
    const backgroundColor = this.addOpacityToColor(
      this.config.scoreColor,
      opacity * 0.2
    );

    const newRange = new vscode.Range(
      animation.range.start.line,
      animation.range.start.character,
      animation.range.end.line,
      animation.range.end.character
    );

    const displayText = `${this.config.scoreDecoration} ${animation.scoreText}`;

    const vibrantColor = this.makeColorVibrant(baseColor, opacity);

    editor.setDecorations(animation.decorationType, [
      {
        range: newRange,
        renderOptions: {
          after: {
            contentText: displayText,
            color: vibrantColor,
            fontWeight: "bold",
            backgroundColor: backgroundColor,
            margin: "0 0 0 12px", // Increased margin for better visibility
          },
        },
      },
    ]);
  }

  /**
   * Make a color more vibrant/bright for better visibility
   */
  private makeColorVibrant(color: string, opacity: number): string {
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbaMatch) {
      let r = parseInt(rgbaMatch[1]);
      let g = parseInt(rgbaMatch[2]);
      let b = parseInt(rgbaMatch[3]);

      r = Math.min(255, Math.floor(r * 1.2));
      g = Math.min(255, Math.floor(g * 1.2));
      b = Math.min(255, Math.floor(b * 1.2));

      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }

  private addOpacityToColor(hex: string, opacity: number): string {
    hex = hex.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  private cleanupAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      clearInterval(animation.intervalId);
      animation.decorationType.dispose();
      this.activeAnimations.delete(id);
    }
  }

  /**
   * Clean up all active animations
   */
  dispose(): void {
    for (const [id] of this.activeAnimations) {
      this.cleanupAnimation(id);
    }
    this.activeAnimations.clear();
  }
}
