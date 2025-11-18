import * as vscode from "vscode";

export interface CompletionAcceptanceEvent {
  text: string;
  position: vscode.Position;
  document: vscode.TextDocument;
}

export type CompletionAcceptanceCallback = (
  event: CompletionAcceptanceEvent
) => void;

export class CompletionDetector implements vscode.InlineCompletionItemProvider {
  private callbacks: CompletionAcceptanceCallback[] = [];
  private lastDocumentVersion: Map<string, number> = new Map();
  private lastDocumentText: Map<string, string> = new Map();

  constructor() {
    vscode.workspace.onDidChangeTextDocument((e) => {
      this.handleDocumentChange(e);
    });
  }

  onCompletionAccepted(
    callback: CompletionAcceptanceCallback
  ): vscode.Disposable {
    this.callbacks.push(callback);
    return new vscode.Disposable(() => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    });
  }

  provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<
    vscode.InlineCompletionItem[] | vscode.InlineCompletionList
  > {
    const docKey = document.uri.toString();
    this.lastDocumentVersion.set(docKey, document.version);
    this.lastDocumentText.set(docKey, document.getText());

    return [];
  }

  private handleDocumentChange(e: vscode.TextDocumentChangeEvent) {
    if (e.contentChanges.length === 0) {
      return;
    }

    const docKey = e.document.uri.toString();
    const lastVersion = this.lastDocumentVersion.get(docKey) || 0;

    // Only process if this is a new change
    if (e.document.version <= lastVersion) {
      return;
    }

    const changes = e.contentChanges.filter((change) => change.text.length > 0);

    if (changes.length === 1) {
      const change = changes[0];
      const insertedText = change.text;

      const isInsertion = change.range.isEmpty;

      if (isInsertion && insertedText.length > 3) {
        const startPosition = change.range.start;

        const lines = insertedText.split("\n");
        const lineCount = lines.length;

        let endLine = startPosition.line + lineCount - 1;
        let endCharacter: number;

        if (lineCount === 1) {
          endCharacter = startPosition.character + insertedText.length;
        } else {
          endCharacter = lines[lines.length - 1].length;
        }

        const endPosition = new vscode.Position(endLine, endCharacter);

        this.notifyCallbacks({
          text: insertedText,
          position: endPosition,
          document: e.document,
        });
      }
    }

    this.lastDocumentVersion.set(docKey, e.document.version);
    this.lastDocumentText.set(docKey, e.document.getText());
  }

  private notifyCallbacks(event: CompletionAcceptanceEvent) {
    for (const callback of this.callbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in completion acceptance callback:", error);
      }
    }
  }
}
