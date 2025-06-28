# Tekton Pipeline Visualizer

A VS Code extension that provides interactive visualization of Tekton Pipelines and PipelineRuns using PatternFly topology components.

## Features

- 🎯 **Interactive Pipeline Visualization**: View Tekton pipelines with interactive topology graphs
- 🔄 **PipelineRun Support**: Visualize both Pipeline and PipelineRun YAML files
- 🎨 **Beautiful UI**: Uses PatternFly components for a professional look
- 📊 **Task Dependencies**: Clear visualization of task dependencies and execution flow
- 🚀 **Live Parsing**: Real-time parsing of YAML content
- 📝 **Sample Pipelines**: Includes sample pipelines for testing and learning

## Usage

### Commands

The extension provides three main commands accessible via the Command Palette (`Cmd+Shift+P`):

1. **Tekton: Visualize Pipeline** - Visualize a Tekton Pipeline from the active editor
2. **Tekton: Visualize Pipeline Run** - Visualize a Tekton PipelineRun from the active editor  
3. **Tekton: Open Sample Pipeline** - Load a sample pipeline for testing

### Context Menu

When editing YAML files, right-click to access:
- **Visualize Pipeline**
- **Visualize Pipeline Run**

### Getting Started

1. Open a Tekton Pipeline or PipelineRun YAML file
2. Use `Cmd+Shift+P` and search for "Tekton: Visualize Pipeline" 
3. The visualization will open in a new webview panel

Or try the samples:
1. Use `Cmd+Shift+P` and search for "Tekton: Open Sample Pipeline"
2. Choose from available samples
3. Then visualize the opened sample

## Sample Pipelines

The extension includes sample pipelines to help you get started:

- **Simple Pipeline**: A linear CI/CD pipeline (git-clone → build → test → deploy)
- **Parallel Pipeline**: A complex pipeline with parallel execution paths
- **Finally Pipeline**: A pipeline demonstrating cleanup tasks

## Technical Details

### Built With

- **React 18**: Modern React with hooks and functional components
- **PatternFly**: Enterprise-grade UI components and topology visualization
- **TypeScript**: Full type safety and IntelliSense support
- **@konflux/tekton-pipeline-renderer**: Core pipeline visualization components

### Architecture

- **Extension Host**: VS Code extension (`extension.js`) - handles commands and webview creation
- **Webview**: React application (`webview.js`) - renders the pipeline visualization
- **Package Integration**: Uses the `@konflux/tekton-pipeline-renderer` library for core functionality

### Bundle Size

- Extension: ~5KB (lightweight VS Code integration)
- Webview: ~3.5MB (includes React, PatternFly, and topology components)

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.74+

### Building

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Build webview  
npm run build:webview

# Build both
npm run build && npm run build:webview
```

### Debugging

1. Open in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new VS Code window

### Development Commands

```bash
# Watch mode for extension
npm run dev

# Watch mode for webview
npm run dev:webview

# Clean build artifacts
npm run clean
```

## File Structure

```
vscode-tekton-3/
├── src/
│   ├── extension.ts              # VS Code extension entry point
│   └── webview/
│       ├── index.tsx             # Webview entry point
│       └── TektonVisualizationApp.tsx  # Main React component
├── samples/                      # Sample pipeline files
├── dist/                         # Build output
├── .vscode/                      # VS Code configuration
├── webpack.config.js             # Extension build config
├── webpack.webview.config.js     # Webview build config
├── tsconfig.json                 # Extension TypeScript config
└── tsconfig.webview.json         # Webview TypeScript config
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Build and test the extension
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please use the GitHub issue tracker. 