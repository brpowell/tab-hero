import * as vscode from "vscode";
import { SessionStats, AllTimeStats } from "./statsTracker";

export class StatsDashboard {
  private panel: vscode.WebviewPanel | undefined;
  private readonly viewType = "tabHero.statsDashboard";

  createOrShow(
    context: vscode.ExtensionContext,
    sessionStats: SessionStats,
    allTimeStats: AllTimeStats
  ): void {
    if (this.panel) {
      this.panel.reveal();
      this.updateContent(sessionStats, allTimeStats);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      this.viewType,
      "Tab Hero Stats",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      null,
      context.subscriptions
    );

    this.updateContent(sessionStats, allTimeStats);
  }

  updateContent(sessionStats: SessionStats, allTimeStats: AllTimeStats): void {
    if (!this.panel) {
      return;
    }

    this.panel.webview.html = this.getWebviewContent(
      sessionStats,
      allTimeStats
    );
  }

  private getWebviewContent(
    sessionStats: SessionStats,
    allTimeStats: AllTimeStats
  ): string {
    const rankColor = this.getRankColor(sessionStats.rank);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tab Hero Stats</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial Black', 'Impact', 'Franklin Gothic Bold', sans-serif;
            background: #0a0a0a;
            background-image: 
                radial-gradient(circle at 20% 50%, rgba(255, 0, 0, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(0, 255, 0, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(255, 255, 0, 0.05) 0%, transparent 50%);
            color: #fff;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        h1 {
            font-size: 4em;
            margin-bottom: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 8px;
            color: #ff0000;
            text-shadow: 
                0 0 5px #ff0000,
                0 0 10px #ff0000,
                4px 4px 0px #000,
                8px 8px 0px #333;
            display: inline-block;
        }
        
        .emoji-left {
            display: inline-block;
            font-size: 2em;
            animation: tabSlide 1.5s ease-in-out infinite;
            margin-left: 20px;
        }
        
        @keyframes guitarStrum {
            0%, 100% {
                transform: rotate(-15deg) translateY(0);
            }
            50% {
                transform: rotate(15deg) translateY(-10px);
            }
        }
        
        @keyframes tabSlide {
            0%, 100% {
                transform: translateX(0);
            }
            50% {
                transform: translateX(10px);
            }
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #1a1a1a;
            border: 3px solid #333;
            border-radius: 0;
            padding: 30px;
            box-shadow: 
                0 0 20px rgba(255, 0, 0, 0.3),
                inset 0 0 20px rgba(0, 0, 0, 0.5);
            position: relative;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff0000, #ffd700, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
            background-size: 200% 100%;
            animation: slide 3s linear infinite;
        }
        
        @keyframes slide {
            0% { background-position: 0% 0%; }
            100% { background-position: 200% 0%; }
        }
        
        .stat-card h2 {
            font-size: 2em;
            margin-bottom: 20px;
            text-align: center;
            border-bottom: 3px solid #ff0000;
            padding-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 3px;
            color: #fff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        
        .stat-item {
            margin-bottom: 25px;
        }
        
        .stat-label {
            font-size: 1em;
            color: #888;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
        }
        
        .stat-value {
            font-size: 3em;
            font-weight: 900;
            color: #fff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        
        .rank-badge {
            display: inline-block;
            background: ${rankColor};
            padding: 15px 40px;
            border-radius: 0;
            font-size: 1.8em;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 4px;
            border: 3px solid #fff;
            box-shadow: 
                0 0 20px rgba(255, 255, 255, 0.5),
                inset 0 0 20px rgba(0, 0, 0, 0.3);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        
        .tpm-display {
            font-size: 3.5em;
            color: #00ff00;
            text-shadow: 
                0 0 10px #00ff00,
                0 0 20px #00ff00,
                2px 2px 4px rgba(0,0,0,0.8);
        }
        
        .score-display {
            font-size: 3.5em;
            color: #ffd700;
            text-shadow: 
                0 0 10px #ffd700,
                0 0 20px #ffd700,
                2px 2px 4px rgba(0,0,0,0.8);
        }
        
        .tabs-display {
            font-size: 3em;
            color: #00ffff;
            text-shadow: 
                0 0 10px #00ffff,
                0 0 20px #00ffff,
                2px 2px 4px rgba(0,0,0,0.8);
        }
        
        .rank-section {
            text-align: center;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 2em;
                letter-spacing: 4px;
            }
            
            .emoji-left {
                font-size: 3.5em;
                margin: 0 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="emoji-left">⇥</span>
            <h1>TAB HERO</h1>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h2>Session</h2>
                
                <div class="stat-item">
                    <div class="stat-label">Rank</div>
                    <div class="rank-section">
                        <div class="rank-badge">${sessionStats.rank}</div>
                    </div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">Score</div>
                    <div class="stat-value score-display">${this.formatNumber(
                      sessionStats.score
                    )}</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">Tabs</div>
                    <div class="stat-value tabs-display">${this.formatNumber(
                      sessionStats.tabs
                    )}</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">Tabs Per Minute (TPM)</div>
                    <div class="stat-value tpm-display">${sessionStats.tpm.toFixed(
                      1
                    )}</div>
                </div>
            </div>
            
            <div class="stat-card">
                <h2>All Time</h2>

                <div class="stat-item">
                    <div class="stat-label">Highest Rank</div>
                    <div class="rank-section">
                        <div class="rank-badge" style="background: ${this.getRankColor(
                          allTimeStats.highestRank || "Roadie"
                        )}">${allTimeStats.highestRank || "Roadie"}</div>
                    </div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">Total Score</div>
                    <div class="stat-value score-display">${this.formatNumber(
                      allTimeStats.score
                    )}</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">Total Tabs</div>
                    <div class="stat-value tabs-display">${this.formatNumber(
                      allTimeStats.tabs
                    )}</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-label">Highest TPM</div>
                    <div class="stat-value tpm-display">${(
                      allTimeStats.highestTPM ?? 0
                    ).toFixed(1)}</div>
                </div>
                

            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private getRankColor(rank: string): string {
    const colors: { [key: string]: string } = {
      Roadie: "#666666", // Gray
      "Rhythm Rookie": "#00ff00", // Green (like Guitar Hero)
      "Tab Warrior": "#ffff00", // Yellow
      Expert: "#ff0000", // Red
      "Combo King": "#ff00ff", // Magenta
      Shredder: "#ffd700", // Gold
      "Tab Hero": "#ffffff", // White with rainbow effect
      "Tab Legend": "#ffffff", // White with rainbow effect
    };
    return colors[rank] || colors["Roadie"];
  }

  private formatNumber(num: number): string {
    return num.toLocaleString();
  }

  dispose(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }
}
