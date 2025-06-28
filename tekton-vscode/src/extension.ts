import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('Tekton Pipeline Visualizer is now active!');

    // Register the visualize pipeline command
    const visualizePipelineCommand = vscode.commands.registerCommand('tekton.visualizePipeline', () => {
        createPipelineVisualizationPanel(context, 'pipeline');
    });

    // Register the visualize pipeline run command
    const visualizePipelineRunCommand = vscode.commands.registerCommand('tekton.visualizePipelineRun', () => {
        createPipelineVisualizationPanel(context, 'pipelinerun');
    });

    // Register the open sample command
    const openSampleCommand = vscode.commands.registerCommand('tekton.openSample', async () => {
        const options = [
            'Simple Pipeline',
            'Parallel Pipeline', 
            'Finally Pipeline'
        ];
        
        const selection = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select a sample pipeline to open'
        });

        if (selection) {
            openSamplePipeline(context, selection);
        }
    });

    context.subscriptions.push(
        visualizePipelineCommand,
        visualizePipelineRunCommand,
        openSampleCommand
    );
}

function createPipelineVisualizationPanel(context: vscode.ExtensionContext, type: 'pipeline' | 'pipelinerun') {
    // Create and show a new webview panel
    const panel = vscode.window.createWebviewPanel(
        'tektonVisualization',
        `Tekton ${type === 'pipeline' ? 'Pipeline' : 'Pipeline Run'} Visualization`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, 'dist'),
                vscode.Uri.joinPath(context.extensionUri, 'node_modules')
            ]
        }
    );

    // Get current editor content if it's a YAML file
    let yamlContent = '';
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'yaml') {
        yamlContent = activeEditor.document.getText();
    }

    // Set the webview's HTML content
    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri, yamlContent, type);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        (message: any) => {
            switch (message.command) {
                case 'error':
                    vscode.window.showErrorMessage(message.text);
                    break;
                case 'info':
                    vscode.window.showInformationMessage(message.text);
                    break;
                case 'log':
                    console.log('Webview:', message.text);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, yamlContent: string, type: string): string {
    // Get the webview script URI
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
    
    // Get the PatternFly CSS from CDN
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline' https://unpkg.com; script-src 'nonce-${nonce}' ${webview.cspSource}; connect-src https:; img-src ${webview.cspSource} data:;">
    
    <!-- PatternFly CSS -->
    <link rel="stylesheet" href="https://unpkg.com/@patternfly/patternfly@5.4.1/patternfly.css">
    <link rel="stylesheet" href="https://unpkg.com/@patternfly/patternfly@5.4.1/patternfly-addons.css">
    
    <title>Tekton Pipeline Visualization</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
            height: 100vh;
            overflow: hidden;
        }
        
        #root {
            height: 100vh;
            width: 100vw;
        }
        
        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            flex-direction: column;
        }
        
        .error-container {
            padding: 20px;
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            margin: 20px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading-container">
            <div>🚀 Loading Tekton Pipeline Visualization...</div>
        </div>
    </div>

    <script nonce="${nonce}">
        // Pass initial data to the React app
        window.vscode = acquireVsCodeApi();
        window.initialData = {
            yamlContent: ${JSON.stringify(yamlContent)},
            type: ${JSON.stringify(type)}
        };
        
        // Message passing helpers
        window.postMessage = (message) => {
            window.vscode.postMessage(message);
        };
    </script>
    
    <!-- Load React from CDN -->
    <script nonce="${nonce}" crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script nonce="${nonce}" crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    
    <!-- Load our webview script -->
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

async function openSamplePipeline(context: vscode.ExtensionContext, sampleName: string) {
    const sampleFiles = {
        'Simple Pipeline': 'simple-pipeline.yaml',
        'Parallel Pipeline': 'parallel-pipeline.yaml',
        'Finally Pipeline': 'finally-pipeline.yaml'
    };

    const fileName = sampleFiles[sampleName as keyof typeof sampleFiles];
    if (!fileName) return;

    const samplePath = path.join(context.extensionPath, 'samples', fileName);
    
    try {
        if (fs.existsSync(samplePath)) {
            const doc = await vscode.workspace.openTextDocument(samplePath);
            await vscode.window.showTextDocument(doc);
        } else {
            vscode.window.showWarningMessage(`Sample file not found: ${fileName}`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open sample: ${error}`);
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function deactivate() {} 