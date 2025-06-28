# Using Tekton Pipeline Renderer in VS Code Extensions

This guide shows how to integrate the Tekton Pipeline Renderer into your VS Code extension for rendering pipeline visualizations in webviews.

## 🚀 Quick Start

### Installation

```bash
npm install @konflux/tekton-pipeline-renderer
```

### Basic Extension Setup

```typescript
// extension.ts
import * as vscode from 'vscode';
import { PipelineRunVisualization, YAMLParser } from '@konflux/tekton-pipeline-renderer';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('tekton.showPipeline', () => {
    const panel = vscode.window.createWebviewPanel(
      'tektonPipeline',
      'Tekton Pipeline',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'node_modules'),
          vscode.Uri.joinPath(context.extensionUri, 'dist')
        ]
      }
    );

    panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);
  });

  context.subscriptions.push(disposable);
}
```

## 📦 Bundle Optimization for Extensions

### Option 1: Lightweight Utils Only

For extensions that only need YAML parsing:

```typescript
// Import only utilities to minimize bundle size
import { YAMLParser } from '@konflux/tekton-pipeline-renderer/utils';

// Parse pipeline YAML
const pipelineRun = YAMLParser.parsePipelineRun(yamlContent);
```

### Option 2: Components with External Dependencies

For webview-based visualization:

```typescript
// In your webview HTML
import { PipelineRunVisualization } from '@konflux/tekton-pipeline-renderer/components';

// External PatternFly CSS (load from CDN in webview)
// <link rel="stylesheet" href="https://unpkg.com/@patternfly/patternfly/patternfly.css">
```

### Option 3: Full Bundle (Recommended)

For complete functionality:

```typescript
import { 
  PipelineRunVisualization, 
  YAMLParser,
  getPipelineRunDataModel 
} from '@konflux/tekton-pipeline-renderer';
```

## 🎯 Extension-Specific Patterns

### 1. Webview with Pipeline Visualization

```typescript
// webview.ts
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // Get CSS and JS URIs
  const stylesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'node_modules', '@konflux/tekton-pipeline-renderer', 'dist', 'extension.css')
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'node_modules', '@konflux/tekton-pipeline-renderer', 'dist', 'extension.js')
  );

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${stylesUri}" rel="stylesheet">
      <title>Tekton Pipeline Visualization</title>
    </head>
    <body>
      <div id="pipeline-container"></div>
      <script src="${scriptUri}"></script>
      <script>
        // Initialize the pipeline visualization
        const container = document.getElementById('pipeline-container');
        // Your pipeline rendering logic here
      </script>
    </body>
    </html>
  `;
}
```

### 2. Tree View Integration

```typescript
// treeProvider.ts
import { YAMLParser } from '@konflux/tekton-pipeline-renderer/utils';

export class TektonTreeProvider implements vscode.TreeDataProvider<TektonItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TektonItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  async getChildren(element?: TektonItem): Promise<TektonItem[]> {
    if (!element) {
      // Get pipeline files from workspace
      const pipelineFiles = await this.findPipelineFiles();
      return pipelineFiles.map(file => new TektonItem(file));
    }
    
    // Parse pipeline and return tasks as children
    const content = await vscode.workspace.fs.readFile(element.resourceUri);
    const yamlContent = Buffer.from(content).toString('utf8');
    
    try {
      const pipeline = YAMLParser.parsePipelineRun(yamlContent);
      return pipeline.spec.pipelineSpec.tasks.map(task => 
        new TektonItem(task.name, element.resourceUri, task)
      );
    } catch {
      return [];
    }
  }
}
```

### 3. Document Validation

```typescript
// validation.ts
import { YAMLParser } from '@konflux/tekton-pipeline-renderer/utils';

export function validateTektonDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  
  try {
    YAMLParser.parsePipelineRun(document.getText());
  } catch (error) {
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(0, 0, document.lineCount - 1, 0),
      `Invalid Tekton YAML: ${error.message}`,
      vscode.DiagnosticSeverity.Error
    );
    diagnostics.push(diagnostic);
  }
  
  return diagnostics;
}
```

## 📊 Bundle Size Optimization

### Webpack Configuration for Extensions

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode',
    // Externalize heavy dependencies
    '@patternfly/react-topology': 'commonjs @patternfly/react-topology'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      // Use lightweight bundles when possible
      '@konflux/tekton-pipeline-renderer': '@konflux/tekton-pipeline-renderer/utils'
    }
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          name: 'vendor',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

## 🎨 CSS Handling

### Method 1: Bundle CSS with Extension

```typescript
// In your extension activation
import '@konflux/tekton-pipeline-renderer/styles';
```

### Method 2: Load CSS in Webview

```html
<!-- In webview HTML -->
<link rel="stylesheet" href="https://unpkg.com/@patternfly/patternfly/patternfly.css">
<link rel="stylesheet" href="${extensionUri}/dist/extension.css">
```

### Method 3: Inline Critical CSS

```typescript
// For minimal overhead, inline only critical styles
const criticalCSS = `
  .pipelinerun-graph { 
    width: 100%; 
    height: 400px; 
  }
  /* Add only essential styles */
`;
```

## 🔧 Extension Manifest (package.json)

```json
{
  "name": "your-tekton-extension",
  "displayName": "Tekton Pipeline Viewer",
  "description": "View and visualize Tekton pipelines",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.60.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onLanguage:yaml",
    "onCommand:tekton.showPipeline"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "tekton.showPipeline",
        "title": "Show Pipeline Visualization"
      }
    ],
    "languages": [
      {
        "id": "tekton",
        "aliases": ["Tekton", "tekton"],
        "extensions": [".tekton.yaml", ".tekton.yml"]
      }
    ]
  },
  "dependencies": {
    "@konflux/tekton-pipeline-renderer": "^1.0.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.60.0",
    "typescript": "^4.7.4"
  }
}
```

## 🚀 Performance Tips

1. **Lazy Loading**: Load visualization components only when needed
2. **Bundle Splitting**: Use different bundles for different features
3. **External Dependencies**: Keep heavy dependencies external
4. **CSS Optimization**: Use critical CSS inlining
5. **Tree Shaking**: Import only needed components

## 🐛 Common Issues

### Issue: "Cannot resolve module"
**Solution**: Use specific import paths:
```typescript
import { YAMLParser } from '@konflux/tekton-pipeline-renderer/utils';
```

### Issue: "Bundle too large"
**Solution**: Use the lightweight utils bundle:
```typescript
import { YAMLParser } from '@konflux/tekton-pipeline-renderer/utils';
// Don't import visualization components unless needed
```

### Issue: "CSS not loading in webview"
**Solution**: Use webview URI conversion:
```typescript
const stylesUri = webview.asWebviewUri(stylesCssPath);
```

## 📚 Examples

See the `/examples/vscode-extension` directory for a complete working example. 