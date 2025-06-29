import * as vscode from 'vscode';

export class PipelineWebviewProvider {
    private panels: Map<string, vscode.WebviewPanel> = new Map();

    constructor(private context: vscode.ExtensionContext) {}

    async openPipeline(yamlContent: string, fileName: string) {
        const panel = this.createWebviewPanel(`Pipeline: ${fileName}`, fileName);
        this.setupWebview(panel, yamlContent);
    }

    async openPipelineRun(yamlContent: string, fileName: string) {
        const panel = this.createWebviewPanel(`PipelineRun: ${fileName}`, fileName);
        this.setupWebview(panel, yamlContent);
    }

    async loadSample(sampleName: string) {
        const sampleYaml = this.getSampleYaml(sampleName);
        const panel = this.createWebviewPanel(`Sample: ${sampleName}`, 'sample.yaml');
        this.setupWebview(panel, sampleYaml);
    }

    private createWebviewPanel(title: string, fileName: string): vscode.WebviewPanel {
        const panelKey = `${title}-${fileName}`;
        
        // If panel already exists, show it
        if (this.panels.has(panelKey)) {
            const existingPanel = this.panels.get(panelKey)!;
            existingPanel.reveal(vscode.ViewColumn.Beside);
            return existingPanel;
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            'tektonPipelineViewer',
            title,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'),
                    vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview')
                ],
                retainContextWhenHidden: true
            }
        );

        // Store panel reference
        this.panels.set(panelKey, panel);

        // Clean up when panel is disposed
        panel.onDidDispose(() => {
            this.panels.delete(panelKey);
        });

        return panel;
    }

    private setupWebview(panel: vscode.WebviewPanel, yamlContent: string) {
        // Set the webview HTML
        panel.webview.html = this.getWebviewContent(panel.webview);
        
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            message => this.handleWebviewMessage(message, panel),
            undefined,
            this.context.subscriptions
        );

        // Send initial data to webview
        panel.webview.postMessage({
            command: 'loadPipeline',
            yamlContent: yamlContent
        });
    }

    private getWebviewContent(webview: vscode.Webview): string {
        // Get paths to resources  
        const webviewScriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'react-pipeline-app.js')
        );
        
        const webviewStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'styles.css')
        );

        // Aggressive cache-busting
        const timestamp = Date.now();
        const cacheBustingScriptUri = `${webviewScriptUri}?v=${timestamp}`;
        
        // CSP for security
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} https://unpkg.com 'unsafe-eval' 'nonce-${nonce}';">
            <title>🚀 FRESH Tekton Pipeline Visualization v${timestamp}</title>
            <link href="${webviewStyleUri}" rel="stylesheet">
        </head>
        <body>
            <div id="root">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>🎯 Loading FRESH React App v${timestamp} 🎯</p>
                </div>
            </div>
            
            <!-- Debug info -->
            <script nonce="${nonce}">
                console.log('🚀 WEBVIEW HTML LOADED - Version: ${timestamp}');
                console.log('🚀 Script URI: ${cacheBustingScriptUri}');
                console.log('🚀 Raw Script URI: ${webviewScriptUri}');
                
                // Force check if script exists
                fetch('${cacheBustingScriptUri}')
                  .then(r => console.log('✅ Script fetch status:', r.status))
                  .catch(e => console.log('❌ Script fetch error:', e));
            </script>
            
            <!-- React from CDN -->
            <script nonce="${nonce}" crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
            <script nonce="${nonce}" crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
            
            <!-- Our webview app -->
            <script nonce="${nonce}" src="${cacheBustingScriptUri}"></script>
        </body>
        </html>`;
    }

    private handleWebviewMessage(message: any, panel: vscode.WebviewPanel) {
        console.log(`[Extension] Received message:`, message);
        switch (message.command) {
            case 'ready':
                console.log('[Extension] Webview is ready');
                break;
            case 'test':
                console.log('[Extension] Test message received:', message.data);
                vscode.window.showInformationMessage(`Test message: ${message.data}`);
                // Send a response back
                panel.webview.postMessage({
                    command: 'response',
                    data: 'Hello from extension!'
                });
                break;
            case 'requestSample':
                console.log('[Extension] Sample pipeline requested');
                this.loadSamplePipeline(panel);
                break;
            case 'nodeClicked':
                vscode.window.showInformationMessage(`Pipeline node clicked: ${message.nodeId}`);
                break;
            case 'error':
                vscode.window.showErrorMessage(`Pipeline visualization error: ${message.error}`);
                break;
        }
    }

    private loadSamplePipeline(panel: vscode.WebviewPanel) {
        const sampleYaml = this.getSampleYaml('simple-pipeline');
        panel.webview.postMessage({
            command: 'loadPipeline',
            yamlContent: sampleYaml
        });
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private getSampleYaml(sampleName: string): string {
        // Return sample YAML content based on the sample name
        switch (sampleName) {
            case 'simple-pipeline':
                return `apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: simple-pipeline-run
  namespace: default
spec:
  pipelineSpec:
    tasks:
    - name: build
      taskSpec:
        steps:
        - name: build-step
          image: node:16
          script: |
            echo "Building application..."
            npm install
            npm run build
    - name: test
      taskSpec:
        steps:
        - name: test-step
          image: node:16
          script: |
            echo "Running tests..."
            npm test
      runAfter:
      - build
    - name: deploy
      taskSpec:
        steps:
        - name: deploy-step
          image: kubectl:latest
          script: |
            echo "Deploying application..."
            kubectl apply -f deployment.yaml
      runAfter:
      - test`;

            case 'parallel-pipeline':
                return `apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: parallel-pipeline-run
  namespace: default
spec:
  pipelineSpec:
    tasks:
    - name: checkout
      taskSpec:
        steps:
        - name: git-clone
          image: alpine/git
          script: git clone https://github.com/example/repo.git
    - name: lint
      taskSpec:
        steps:
        - name: eslint
          image: node:16
          script: npm run lint
      runAfter:
      - checkout
    - name: unit-tests
      taskSpec:
        steps:
        - name: jest
          image: node:16
          script: npm run test:unit
      runAfter:
      - checkout
    - name: build
      taskSpec:
        steps:
        - name: webpack
          image: node:16
          script: npm run build
      runAfter:
      - lint
      - unit-tests
    - name: integration-tests
      taskSpec:
        steps:
        - name: cypress
          image: cypress/included
          script: npm run test:e2e
      runAfter:
      - build
    - name: security-scan
      taskSpec:
        steps:
        - name: snyk
          image: snyk/snyk
          script: snyk test
      runAfter:
      - build
    - name: deploy
      taskSpec:
        steps:
        - name: kubectl
          image: kubectl:latest
          script: kubectl apply -f k8s/
      runAfter:
      - integration-tests
      - security-scan`;

            default:
                return `apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: sample-pipeline-run
  namespace: default
spec:
  pipelineSpec:
    tasks:
    - name: hello
      taskSpec:
        steps:
        - name: echo
          image: alpine
          script: echo "Hello from Tekton!"`;
        }
    }
} 