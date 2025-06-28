# 🚀 Tekton Pipeline Combo

A unified monorepo for building and maintaining Tekton pipeline visualization tools. This project solves the drift problem between the npm package and VSCode extension by maintaining a **single source of truth** for all pipeline rendering logic.

## 📦 What's Inside

- **`tekton-pipeline-renderer/`** - React component library for rendering Tekton pipelines
- **`tekton-vscode/`** - VSCode extension that uses the renderer package
- **Unified build system** - Coordinated development, testing, and release workflow

## 🎯 Core Philosophy

**Single Source of Truth**: All pipeline rendering logic lives in `tekton-pipeline-renderer/`. The VSCode extension is a thin wrapper that consumes this package.

**Change Flow**: `tekton-pipeline-renderer/` → `tekton-vscode/` → Release

## 🔄 Propagation Modes

The system supports two propagation modes to optimize for different use cases:

### 🔧 Development Mode: `npm run propagate`
```bash
tekton-pipeline-renderer/  ──link──>  tekton-vscode/
```
- **Fast**: Uses `file:../tekton-pipeline-renderer` dependency
- **Live Updates**: Changes in renderer immediately available in extension
- **Good for**: Active development, debugging, testing
- **VSCode Extension**: Links to live renderer package

### 📦 Bundle Mode: `npm run propagate:bundle`
```bash
tekton-pipeline-renderer/src/  ──copy──>  tekton-vscode/src/lib/
```
- **Self-Contained**: Physically copies renderer source into extension
- **Distribution Ready**: No external dependencies
- **Good for**: Releases, CI/CD, distribution
- **VSCode Extension**: Contains all renderer code internally

### 📁 What Bundle Mode Creates

After running `npm run propagate:bundle`:
```
tekton-vscode/
├── src/
│   ├── extension.ts
│   ├── lib/
│   │   └── tekton-renderer/          ← Copied from renderer
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── types/
│   │       ├── utils/
│   │       └── index.ts             ← Auto-generated exports
│   └── webview/
└── package.json                     ← External dependency removed
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Yarn 1.22+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tekton-pipeline-combo.git
cd tekton-pipeline-combo

# Install all dependencies (from root - manages all workspaces)
yarn install

# Run the complete CI pipeline
npm run ci
```

> **⚠️ Important**: Always run `yarn install` from the **root directory**. The monorepo uses yarn workspaces with a single `yarn.lock` file that manages all dependencies for both packages.

### Development Workflow

#### 1. Working on Pipeline Rendering Features

```bash
# Develop in the renderer package
cd tekton-pipeline-renderer
npm run dev

# Run the interactive sample app
npm run sample

# Run tests
npm run test
```

#### 2. Propagating Changes to VSCode Extension

```bash
# Development mode (fast, uses file dependency)
npm run propagate

# Test the VSCode extension
npm run test:vscode

# For release (bundles code inside extension)
npm run propagate:bundle

# Build the extension
npm run build:extension
```

#### 3. Complete Development Cycle

```bash
# Clean everything
npm run clean

# Run complete CI pipeline
npm run ci

# Prepare for release
npm run release:prepare
```

## 🛠️ Available Commands

### Root Level Commands

| Command | Description |
|---------|-------------|
| `npm run ci` | Complete CI pipeline (clean, install, lint, test, build) |
| `npm run clean` | Clean all build artifacts |
| `npm run build` | Build both packages |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all code |
| `npm run propagate` | Sync changes (development mode - file dependency) |
| `npm run propagate:bundle` | Bundle renderer code inside VSCode extension |
| `npm run release:check` | Comprehensive release validation |
| `npm run sample` | Run the React sample app |

### Renderer Package Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the npm package |
| `npm run sample` | Interactive demo app |
| `npm run test` | Run React component tests |
| `npm run npm:publish` | Publish to npm |

### VSCode Extension Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build the extension |
| `npm run test:extension` | Run VSCode extension tests |
| `npm run vscode:package` | Create .vsix file |

## 🧪 Testing Strategy

### Renderer Package Tests
- **Unit Tests**: React components, hooks, utilities
- **Integration Tests**: YAML parsing, data processing
- **Sample App**: Interactive testing environment

### VSCode Extension Tests
- **Extension Activation**: Verify extension loads correctly
- **Command Registration**: Test all contributed commands
- **Webview Integration**: Test pipeline visualization in VSCode

### CI/CD Pipeline
- **Matrix Testing**: Node.js 18.x and 20.x
- **Progressive Validation**: Lint → Test → Build → Propagate → Integration Test
- **Artifact Generation**: Ready-to-release packages

## 📁 Project Structure

```
tekton-pipeline-combo/
├── 📦 tekton-pipeline-renderer/     # NPM package (single source of truth)
│   ├── src/components/              # React components
│   ├── src/hooks/                   # Custom hooks  
│   ├── src/utils/                   # Utilities (YAML parsing, etc.)
│   ├── src/types/                   # TypeScript definitions
│   ├── example/                     # Interactive sample app
│   └── samples/                     # Sample pipeline YAML files
├── 🔌 tekton-vscode/               # VSCode extension
│   ├── src/extension.ts            # Extension entry point
│   ├── src/webview/                # Webview integration
│   └── src/test/                   # VSCode extension tests
├── 🔧 scripts/                     # Build and automation scripts
├── 📋 .cursorrules                 # Development workflow rules
└── 🚀 .github/workflows/           # CI/CD pipeline
```

## 🔄 Development Rules (Enforced by Cursor)

### ✅ ALLOWED in `tekton-pipeline-renderer/`:
- React components for pipeline visualization
- YAML parsing utilities
- Type definitions for Tekton resources
- Hooks for data processing
- Tests for rendering logic
- Sample application updates

### ✅ ALLOWED in `tekton-vscode/`:
- VSCode extension entry point (`extension.ts`)
- VSCode-specific commands and providers
- Webview integration code
- Extension configuration and manifests
- VSCode extension tests

### ❌ FORBIDDEN in `tekton-vscode/`:
- React components for pipeline rendering
- YAML parsing logic (unless VSCode-specific)
- Duplicate type definitions
- Rendering algorithms or layout logic
- **NEVER** edit files in `src/lib/` (auto-generated by propagation)

## 🚀 Release Process

### NPM Package Release

```bash
# Ensure everything is tested and built
npm run release:check

# Publish to npm
npm run npm:publish
```

### VSCode Extension Release

```bash
# Create the .vsix package
npm run vscode:package

# Install locally for testing
code --install-extension tekton-vscode/tekton-pipeline-visualizer-*.vsix

# Publish to marketplace (requires publisher setup)
npx vsce publish
```

## 🎨 Architecture Benefits

### Before (Drift Problem)
```
tekton-pipeline-renderer/   ──┐
                               ├─ Separate implementations
tekton-vscode/              ──┘   (prone to drift)
```

### After (Single Source of Truth)
```
tekton-pipeline-renderer/   ──┐
                               ├─ One implementation
tekton-vscode/              ──┘   (propagated automatically)
```

## 🎯 Key Features

- **🔄 Dual Propagation Modes**: Development (file dependency) + Release (true bundling)
- **📦 True Bundling**: Renderer code physically copied into VSCode extension
- **🧪 Comprehensive Testing**: React tests + VSCode extension tests
- **📦 Dual Packaging**: NPM package + VSCode extension from same source
- **🎨 Interactive Development**: Sample app for immediate feedback
- **🚀 CI/CD Ready**: GitHub Actions workflow included
- **📋 Enforced Workflow**: Cursor rules prevent architectural violations

## 💡 Common Tasks

### Adding a New Pipeline Component

1. **Create** the component in `tekton-pipeline-renderer/src/components/`
2. **Test** with `npm run test:renderer`
3. **Verify** with `npm run sample`
4. **Propagate** with `npm run propagate` (development)
5. **Integration test** with `npm run test:vscode`
6. **Bundle** with `npm run propagate:bundle` (for release)

### Debugging the VSCode Extension

1. **Open** `tekton-vscode/` in VSCode
2. **Run** the extension in debug mode (F5)
3. **Test** with sample pipelines
4. **Check** the developer console for errors

### Updating Dependencies

1. **Update** in `tekton-pipeline-renderer/package.json`
2. **Run** `npm run propagate` to sync to VSCode extension (development)
3. **Run** `npm run propagate:bundle` to bundle for release
4. **Test** both packages with `npm run test`

## 🤝 Contributing

1. **Follow** the cursor rules (`.cursorrules`)
2. **Make changes** in the appropriate package
3. **Run** `npm run ci` before committing
4. **Use** `npm run propagate` after renderer changes

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ to solve the package drift problem and maintain a single source of truth for Tekton pipeline visualization.** 