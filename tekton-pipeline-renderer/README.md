# Tekton Pipeline Renderer

A React component library for rendering Tekton pipelines and pipeline runs with interactive visualizations. This package extracts the working pipeline visualization logic from [konflux-ui](https://github.com/konflux-ci/konflux-ui) into a reusable, independent npm package.

## Features

- ✅ Interactive pipeline visualization using PatternFly topology
- ✅ Pipeline run execution status with color-coded task nodes
- ✅ YAML parsing for Tekton Pipeline and PipelineRun resources
- ✅ Task dependency visualization with edges
- ✅ Responsive design with customizable dimensions
- ✅ TypeScript support with comprehensive type definitions
- ✅ Real-time demo app for testing and development

## Installation

```bash
npm install @konflux/tekton-pipeline-renderer
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react react-dom
```

## Quick Start

### Basic PipelineRun Visualization

```tsx
import React from 'react';
import { PipelineRunVisualization } from '@konflux/tekton-pipeline-renderer';
import { TektonPipelineRunKind, TektonTaskRunKind } from '@konflux/tekton-pipeline-renderer';

const MyComponent = () => {
  const pipelineRun: TektonPipelineRunKind = {
    // Your PipelineRun data
  };
  
  const taskRuns: TektonTaskRunKind[] = [
    // Your TaskRun data
  ];

  return (
    <PipelineRunVisualization 
      pipelineRun={pipelineRun} 
      taskRuns={taskRuns}
    />
  );
};
```

### YAML Parsing

```tsx
import React from 'react';
import { YAMLParser, PipelineRunVisualization } from '@konflux/tekton-pipeline-renderer';

const MyComponent = () => {
  const [pipelineRun, setPipelineRun] = React.useState(null);
  
  const handleYamlInput = (yamlString: string) => {
    try {
      const parsed = YAMLParser.parsePipelineRun(yamlString);
      setPipelineRun(parsed);
    } catch (error) {
      console.error('Failed to parse YAML:', error);
    }
  };

  return (
    <div>
      <textarea onChange={(e) => handleYamlInput(e.target.value)} />
      {pipelineRun && <PipelineRunVisualization pipelineRun={pipelineRun} />}
    </div>
  );
};
```

## 📦 VS Code Extension Integration

This package is **optimized for VS Code extensions** with multiple bundle configurations and lightweight entry points.

### Extension-Optimized Bundles

```typescript
// Option 1: Lightweight utils only (smallest bundle)
import { YAMLParser } from '@konflux/tekton-pipeline-renderer/utils';

// Option 2: Components without heavy dependencies
import { PipelineRunVisualization } from '@konflux/tekton-pipeline-renderer/components';

// Option 3: Full bundle (complete functionality)
import { PipelineRunVisualization, YAMLParser } from '@konflux/tekton-pipeline-renderer';
```

### Build Commands for Extensions

```bash
npm run build:extension    # Optimized for VS Code extensions
npm run build:standalone   # Standard web bundle
npm run analyze-bundle     # Bundle size analysis
```

### VS Code Extension Features

- ✅ **Multiple Entry Points**: Utils, components, or full bundle
- ✅ **CommonJS & ESM**: Compatible with extension bundlers
- ✅ **Lightweight Utils**: YAML parsing without UI dependencies  
- ✅ **External Dependencies**: PatternFly kept external for optimal bundling
- ✅ **CSS Extraction**: Separate CSS files for webview integration
- ✅ **Node.js Compatible**: Works in VS Code's Node.js environment

### Complete Extension Guide

See [VSCODE_EXTENSION.md](./VSCODE_EXTENSION.md) for comprehensive integration examples including:
- Webview setup with pipeline visualization
- Tree view integration for Tekton files
- Document validation and diagnostics
- Bundle size optimization strategies
- CSS handling in webviews

## Demo App

This package includes a **comprehensive interactive demo app** that lets you paste any Tekton YAML and see the visualization in real-time. Perfect for testing, development, and understanding how different pipeline structures render.

### 🚀 Running the Demo

```bash
# Clone the repository
git clone https://github.com/konflux-ci/tekton-pipeline-renderer.git
cd tekton-pipeline-renderer

# Install dependencies
npm install

# Start the interactive demo app
npm run demo
```

The demo will open at **http://localhost:3000** with a split-screen interface:

### 🎨 Demo Interface

**Left Panel - YAML Editor:**
- Large text area for pasting your Tekton PipelineRun YAML
- Monospace font for easy YAML editing
- "Parse & Render" button for manual updates
- Real-time error display with detailed error messages

**Right Panel - Live Visualization:**
- Interactive pipeline topology using PatternFly components
- Task nodes with status indicators
- Dependency edges showing task relationships
- Automatic layout and positioning
- Responsive design that fits your content

**Status Bar:**
- Live feedback on parsing success/errors
- Shows the name of the currently rendered pipeline
- Color-coded status indicators

### 📝 How to Use the Demo

1. **Start with the Example**: The demo loads with a pre-built example showing:
   - `fetch-source` → `build-image` → `deploy-app`
   - `fetch-source` → `test-app` → `deploy-app`
   - Parallel execution and dependency convergence

2. **Paste Your Own YAML**: Replace the example with any valid Tekton PipelineRun YAML

3. **Click "Parse & Render"**: Or simply modify the YAML and parse to see updates

4. **Explore the Visualization**: 
   - See task dependencies as connected nodes
   - Visual status indicators for task states
   - Interactive topology you can pan and zoom

### 🧪 Example Pipelines to Try

**Simple Linear Pipeline:**
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: simple-pipeline
spec:
  pipelineSpec:
    tasks:
    - name: step-1
      taskRef:
        name: task-1
    - name: step-2
      taskRef:
        name: task-2
      runAfter: [step-1]
    - name: step-3
      taskRef:
        name: task-3
      runAfter: [step-2]
```

**Complex Parallel Pipeline:**
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: parallel-pipeline
spec:
  pipelineSpec:
    tasks:
    - name: checkout
      taskRef:
        name: git-clone
    - name: test-unit
      taskRef:
        name: go-test
      runAfter: [checkout]
    - name: test-integration
      taskRef:
        name: integration-test
      runAfter: [checkout]
    - name: build-backend
      taskRef:
        name: go-build
      runAfter: [test-unit]
    - name: build-frontend
      taskRef:
        name: npm-build
      runAfter: [test-integration]
    - name: deploy
      taskRef:
        name: kubectl-apply
      runAfter: [build-backend, build-frontend]
```

### ✨ Demo Features

- **🔄 Real-time Updates**: Instant visualization as you edit YAML
- **❌ Error Handling**: Clear error messages for invalid YAML syntax
- **📊 Task Status**: Visual indicators showing task execution states
- **🔗 Dependencies**: Clear edges showing `runAfter` relationships
- **📱 Responsive**: Works on different screen sizes
- **🎯 Interactive**: Pan, zoom, and explore complex pipelines
- **⚡ Fast**: Optimized parsing and rendering performance

### 🎓 Learning with the Demo

The demo is perfect for:
- **Understanding pipeline structure** before deploying to Tekton
- **Debugging complex dependencies** in your pipeline definitions
- **Testing different YAML structures** and seeing immediate visual feedback
- **Learning Tekton concepts** through interactive exploration
- **Sharing pipeline designs** with team members

### 🐛 Troubleshooting

**Common Issues:**
- **Blank screen**: Check browser console for JavaScript errors
- **Parse errors**: Ensure your YAML is valid Tekton PipelineRun format
- **Missing tasks**: Make sure all `runAfter` references exist
- **Port conflicts**: Use `npm run demo -- --port 3001` for different port

## API Reference

### Components

#### `PipelineRunVisualization`

The main component for rendering pipeline run visualizations.

```tsx
interface PipelineRunVisualizationProps {
  pipelineRun: TektonPipelineRunKind;
  error?: unknown;
  taskRuns?: TektonTaskRunKind[];
}
```

#### `VisualizationFactory`

Advanced component for custom topology visualizations.

```tsx
interface VisualizationFactoryProps {
  model: Model;
  layoutFactory: LayoutFactory;
  componentFactory: ComponentFactory;
  controlBar?: (controller: Controller) => React.ReactNode;
  fullHeight?: boolean;
  children?: React.ReactElement;
}
```

### Utilities

#### `YAMLParser`

Utility for parsing Tekton YAML resources.

```tsx
const pipelineRun = YAMLParser.parsePipelineRun(yamlString);
const pipeline = YAMLParser.parsePipeline(yamlString);
```

#### `getPipelineRunDataModel`

Transform pipeline run data into visualization model.

```tsx
const model = getPipelineRunDataModel(pipelineRun, taskRuns);
```

### Types

The package exports comprehensive TypeScript types:

```tsx
import {
  TektonPipelineRunKind,
  TektonPipelineKind,
  TektonTaskRunKind,
  PipelineRunNodeData,
  runStatus,
} from '@konflux/tekton-pipeline-renderer';
```

## Architecture

This package follows the exact same patterns as the working implementation in konflux-ui:

1. **VisualizationFactory**: Core PatternFly topology wrapper
2. **Layout Factory**: Dagre-based automatic layout
3. **Component Factory**: Maps node types to React components
4. **Data Model**: Transforms Tekton resources into topology models
5. **Node Components**: Individual task visualization components

## Development

### Building the Package

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Examples

### Complex Pipeline with Dependencies

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: complex-pipeline-run
  namespace: default
spec:
  pipelineSpec:
    tasks:
      - name: clone
        taskRef:
          name: git-clone
      - name: build
        taskRef:
          name: buildah
        runAfter: ["clone"]
      - name: test-unit
        taskRef:
          name: test
        runAfter: ["build"]
      - name: test-integration
        taskRef:
          name: integration-test
        runAfter: ["build"]
      - name: security-scan
        taskRef:
          name: security-scan
        runAfter: ["build"]
      - name: deploy-staging
        taskRef:
          name: deploy
        runAfter: ["test-unit", "test-integration", "security-scan"]
      - name: smoke-test
        taskRef:
          name: smoke-test
        runAfter: ["deploy-staging"]
      - name: deploy-prod
        taskRef:
          name: deploy-prod
        runAfter: ["smoke-test"]
    finally:
      - name: cleanup
        taskRef:
          name: cleanup
      - name: notify
        taskRef:
          name: notify-slack
status:
  # ... task execution status
```

This will render as an interactive graph showing:
- Clone → Build → (Unit Tests, Integration Tests, Security Scan) → Deploy Staging → Smoke Tests → Deploy Production
- Finally tasks (Cleanup, Notify) that run regardless of success/failure

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Based on konflux-ui

This package extracts the working pipeline visualization logic from [konflux-ui](https://github.com/konflux-ci/konflux-ui). The goal is to make this functionality available as an independent, reusable package while changing as little as possible from the proven implementation.

## License

MIT License - see [LICENSE](LICENSE) file for details.

# Tekton Pipeline Viewer - VS Code Extension

A Visual Studio Code extension for visualizing and exploring Tekton pipelines with interactive diagrams, powered by the `@konflux/tekton-pipeline-renderer` package.

## 🚀 Features

- **Interactive Pipeline Visualization**: View Tekton pipelines as interactive diagrams
- **Context Menu Integration**: Right-click on YAML files to visualize pipelines
- **Sample Pipelines**: Load built-in sample pipelines for testing
- **Tree View**: Browse Tekton resources in your workspace
- **YAML Validation**: Parse and validate Tekton YAML resources

## 📦 Installation

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd vscode-tekton-2
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run compile
   ```

3. **Open in VS Code:**
   ```bash
   code .
   ```

4. **Run the extension:**
   - Press `F5` to launch a new VS Code Extension Development Host
   - The extension will be loaded and ready to use

## 🎯 Usage

### Opening Pipeline Visualizations

1. **From YAML Files:**
   - Open any Tekton YAML file (`.yaml` or `.yml`)
   - Right-click in the editor
   - Select "Open Tekton Pipeline Visualization"

2. **Using Command Palette:**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Tekton" to see available commands:
     - `Tekton: Open Tekton Pipeline Visualization`
     - `Tekton: Load Sample Pipeline`

### Sample Pipelines

The extension includes several built-in samples:
- Simple Linear Pipeline
- Complex Parallel Pipeline  
- Pipeline with Finally Tasks
- CI/CD Pipeline Example

Access these via the Command Palette: `Tekton: Load Sample Pipeline`

## 🏗️ Architecture

This extension uses the `@konflux/tekton-pipeline-renderer` package for pipeline visualization, which provides:

- **React Components**: For rendering pipeline diagrams
- **YAML Parser**: For parsing Tekton resources
- **PatternFly Integration**: For consistent UI components
- **TypeScript Support**: Full type safety

## 🔧 Development

### Building

```bash
# Development build with watch mode
npm run watch

# Production build
npm run compile
```

### Project Structure

```
vscode-tekton-2/
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── webview.ts        # Webview provider (future enhancement)
│   └── treeProvider.ts   # Tree view provider (future enhancement)
├── samples/              # Sample pipeline files
├── package.json          # Extension manifest
├── webpack.config.js     # Build configuration
└── tsconfig.json         # TypeScript configuration
```

## 🚀 Commands

| Command | Description |
|---------|-------------|
| `tektonViewer.openPipeline` | Open pipeline visualization from active editor |
| `tektonViewer.openPipelineRun` | Open pipeline run visualization |
| `tektonViewer.loadSample` | Load a sample pipeline for testing |

## 🎨 Sample Pipeline

Here's a sample pipeline you can test with:

```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: build-and-deploy
  namespace: default
spec:
  pipelineSpec:
    tasks:
    - name: fetch-source
      taskRef:
        name: git-clone
    - name: run-tests
      taskRef:
        name: npm-test
      runAfter:
      - fetch-source
    - name: build-image
      taskRef:
        name: buildah
      runAfter:
      - run-tests
    - name: deploy-app
      taskRef:
        name: kubectl-apply
      runAfter:
      - build-image
```

## 🛠️ Integration with Tekton Pipeline Renderer

This extension leverages the `@konflux/tekton-pipeline-renderer` package:

```typescript
import { YAMLParser } from '@konflux/tekton-pipeline-renderer/utils';
import { PipelineRunVisualization } from '@konflux/tekton-pipeline-renderer/components';
```

The package provides:
- YAML parsing utilities
- React visualization components
- TypeScript type definitions
- PatternFly UI integration

## 🔮 Future Enhancements

- [ ] Full integration with pipeline renderer components
- [ ] Interactive task node editing
- [ ] Pipeline run status monitoring  
- [ ] Kubernetes cluster integration
- [ ] Pipeline template management
- [ ] Export pipeline diagrams as images

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built on the `@konflux/tekton-pipeline-renderer` package
- Uses PatternFly React components for UI
- Inspired by the Konflux UI pipeline visualization 