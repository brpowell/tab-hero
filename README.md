# ⇥ Tab Hero

A pointless VS Code extension that tracks tab completion score with animations and a stats dashboard.

<a href="https://open-vsx.org/extension/ponchopowell/tabhero">
<img src="https://img.shields.io/open-vsx/v/ponchopowell/tabhero" />
</a>

## Features

- **Score Animations**: See score popups (🎯 +5, 🎯 +100, etc.) when you accept tab completions
- **Quality-Based Scoring**: Scores are calculated based on completion length and complexity
- **Customizable**: Configure score values, colors, animation styles, and more

## How It Works

Tab Hero detects when you accept inline completions and displays an animated score value at the cursor position. The score is calculated based on:

- **Completion length**: Longer completions earn more points
- **Multi-line bonuses**: Multi-line completions get a 20% bonus
- **Complexity indicators**: Additional points for code patterns like functions, blocks, arrays, etc.

> ℹ️ While vendors such as [Cursor](https://cursor.com) work, some of the more advanced replacement suggestions cannot be accounted for. This is due to detection being done by hooking into the VS Code inline completion provider.

## Install
* [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=ponchopowell.tabhero)
* [Open VSX](https://open-vsx.org/extension/ponchopowell/tabhero)

## Configuration

You can customize Tab Hero through VS Code settings:

### Score Calculation

- `tabHero.scoreCalculationMethod`: Choose between `quality` (default), `fixed`, or `random`
- `tabHero.baseScorePerChar`: Base score per character (default: 0.5)
- `tabHero.minScore`: Minimum score value (default: 1)
- `tabHero.maxScore`: Maximum score value (default: 1000)
- `tabHero.fixedScore`: Fixed score when using fixed method (default: 10)
- `tabHero.randomMinScore`: Minimum for random method (default: 5)
- `tabHero.randomMaxScore`: Maximum for random method (default: 100)

### Animation

- `tabHero.animationDuration`: Animation duration in milliseconds (default: 1500)
- `tabHero.animationStyle`: Animation style - `floating` (default) or `fade` (Note: Currently both styles use fade-out animation)
- `tabHero.scoreColor`: Color for score text (default: "#4CAF50")
- `tabHero.scoreDecoration`: Emoji or symbol shown with score (default: "🎯")
- `tabHero.showInlineScoreAnimation`: Enable/disable inline score animations (default: true)
- `tabHero.enabled`: Enable/disable Tab Hero (default: true)

## Develop

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press F5 in VS Code to launch a new Extension Development Host
4. In the new window, accept some tab completions to see the animations!

## License

MIT



