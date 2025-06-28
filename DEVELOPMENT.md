# 🛠️ Development Guide

This guide provides detailed examples and workflows for developing with the Tekton Pipeline Combo monorepo.

## 🚀 Daily Development Workflow

### Starting Development

```bash
# Clean start
npm run clean
npm run install:all

# Start the sample app for immediate feedback
npm run sample
# Opens http://localhost:3000 with interactive pipeline visualization
```

### Making Changes to Pipeline Rendering

```bash
# 1. Implement in the renderer package
cd tekton-pipeline-renderer
npm run dev  # Starts webpack dev server with hot reload

# 2. Test your changes
npm run test  # Run Jest tests
npm run test:watch  # Run tests in watch mode

# 3. Verify with the sample app
npm run sample  # Interactive testing

# 4. Propagate to VSCode extension
cd ..
npm run propagate        # Development mode (fast)
npm run propagate:bundle # Bundle mode (for release)

# 5. Test the extension integration
npm run test:vscode
```

### VSCode Extension Development

```bash
# Open VSCode extension in development mode
cd tekton-vscode
code .
# Press F5 to launch Extension Development Host

# Or build and test from command line
npm run build
npm run test:extension
```

## 🧪 Testing Strategies

### Unit Testing (Renderer Package)

```bash
cd tekton-pipeline-renderer

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx jest src/components/__tests__/PipelineRenderer.spec.tsx
```

### Integration Testing (Sample App)

```bash
# Start the sample app
npm run sample

# Test with different pipeline configurations:
# 1. Simple linear pipeline
# 2. Parallel task execution
# 3. Complex dependency graphs
# 4. Pipeline runs with various statuses
```

### VSCode Extension Testing

```bash
cd tekton-vscode

# Run automated tests
npm run test:extension

# Manual testing in VSCode:
# 1. Open a .yaml file with Tekton pipeline
# 2. Right-click → "Visualize Pipeline"
# 3. Check the webview renders correctly
# 4. Test all contributed commands
```

## 📦 Package Management

### Adding Dependencies

#### To Renderer Package (npm package):
```bash
cd tekton-pipeline-renderer

# Production dependency
yarn add some-package

# Development dependency  
yarn add -D some-dev-package

# Update the VSCode extension
cd ..
npm run propagate
```

#### To VSCode Extension:
```bash
cd tekton-vscode

# Only add VSCode-specific dependencies
yarn add @vscode/some-package

# Never add rendering-related dependencies here!
```

### Updating Dependencies

```bash
# Update all packages
yarn upgrade

# Update specific package
yarn upgrade some-package@^2.0.0

# Always propagate after updating renderer dependencies
npm run propagate          # Development
npm run propagate:bundle   # Release
```

## 🔄 Propagation Process

The propagation script (`scripts/propagate-changes.js`) supports **two modes**:

### 🔧 Development Mode: `npm run propagate`

**What it does:**
1. **Version Synchronization**: Ensures both packages have the same version
2. **Dependency Updates**: Updates VSCode extension to use `file:../tekton-pipeline-renderer`
3. **Sample Files**: Copies sample pipeline files for consistency
4. **Validation**: Runs post-propagation checks

**Good for:** Active development, fast iteration, debugging

### 📦 Bundle Mode: `npm run propagate:bundle`

**What it does:**
1. **Code Copying**: Physically copies renderer source to `tekton-vscode/src/lib/`
2. **Dependency Removal**: Removes external renderer dependency
3. **Index Generation**: Creates bundled exports file
4. **Sample Files**: Copies sample pipeline files
5. **Validation**: Ensures bundled extension builds correctly

**Good for:** Releases, CI/CD, creating self-contained extensions

### Manual Propagation Examples

```bash
# Development workflow
npm run propagate
# Creates: file dependency link

# Release workflow  
npm run propagate:bundle
# Creates: tekton-vscode/src/lib/tekton-renderer/ with all source code
```

### What Bundle Mode Creates

```
Before bundling:
tekton-vscode/package.json
{
  "dependencies": {
    "tekton-pipeline-renderer": "file:../tekton-pipeline-renderer"
  }
}

After bundling:
tekton-vscode/package.json
{
  "dependencies": {
    // renderer dependency removed
  }
}

tekton-vscode/src/lib/tekton-renderer/
├── components/     ← Copied from renderer
├── hooks/         ← Copied from renderer  
├── types/         ← Copied from renderer
├── utils/         ← Copied from renderer
└── index.ts       ← Generated exports
```

### Troubleshooting Propagation

```bash
# If propagation fails, check:
# 1. Are both package.json files valid?
# 2. Does the renderer package build successfully?
# 3. Are there any TypeScript errors?

# Debug mode (shows more output)
node scripts/propagate-changes.js

# Force reinstall dependencies
cd tekton-vscode
rm -rf node_modules package-lock.json
yarn install
```

## 🎨 UI Development

### Using the Sample App

```bash
# Start the sample app
npm run sample

# Features:
# - Live YAML editor
# - Real-time pipeline visualization
# - Error reporting
# - Multiple example pipelines
# - Hot reload on code changes
```

### Component Development

```bash
# 1. Create component in tekton-pipeline-renderer/src/components/
# 2. Add to index.ts exports
# 3. Write tests in __tests__/
# 4. Test with sample app
# 5. Propagate to VSCode extension
```

### Styling Guidelines

- Use PatternFly components consistently
- Follow existing CSS patterns
- Test responsive design in the sample app
- Ensure compatibility with VSCode's theme system

## 🚀 Release Workflow

### Pre-Release Checklist

```bash
# 1. Run complete CI pipeline
npm run ci

# 2. Bundle renderer code into extension
npm run propagate:bundle

# 3. Run comprehensive release check
npm run release:check

# 4. Test sample app
npm run sample

# 5. Manual VSCode extension testing
cd tekton-vscode
code .
# Press F5 and test in Extension Development Host

# 6. Version bump (if needed)
cd tekton-pipeline-renderer
npm version patch  # or minor/major
cd ../tekton-vscode  
npm version patch  # Keep versions in sync
```

### NPM Package Release

```bash
# Build and publish the renderer package
cd tekton-pipeline-renderer
npm run npm:publish

# This runs:
# 1. Clean build
# 2. Run tests
# 3. Build package
# 4. Publish to npm
```

### VSCode Extension Release

```bash
# Create the .vsix package
npm run vscode:package

# Test the package locally
code --install-extension tekton-vscode/tekton-pipeline-visualizer-*.vsix

# Publish to VSCode Marketplace
cd tekton-vscode
npx vsce publish
```

## 🐛 Debugging

### Common Issues

#### "Cannot find module" errors
```bash
# Usually a propagation/dependency issue
npm run propagate
cd tekton-vscode && yarn install
```

#### VSCode extension not loading
```bash
# Check the extension logs in VSCode
# View → Output → Select "Tekton Pipeline Visualizer"

# Rebuild the extension
cd tekton-vscode
npm run build
```

#### Sample app not updating
```bash
# Clear webpack cache
cd tekton-pipeline-renderer
rm -rf node_modules/.cache
npm run sample
```

### Debug Mode

```bash
# Enable debug output
DEBUG=tekton:* npm run sample

# VSCode extension debug
# Open tekton-vscode in VSCode and press F5
```

## 📊 Performance

### Bundle Size Analysis

```bash
# Analyze the renderer package bundle
cd tekton-pipeline-renderer
npm run build
npx webpack-bundle-analyzer dist/

# Analyze the VSCode extension bundle
cd tekton-vscode
npm run build
# Check dist/ folder size
```

### Optimization Tips

1. **Keep PatternFly external** - Don't bundle PatternFly components
2. **Use dynamic imports** - For large components not always needed
3. **Minimize dependencies** - Only add what's necessary
4. **Tree shaking** - Ensure dead code elimination works

## 🔧 Troubleshooting

### Workspace Issues

```bash
# Reset everything (IMPORTANT: Only remove lock files from workspaces, keep root yarn.lock)
npm run clean
rm -rf node_modules 
rm -rf tekton-*/node_modules tekton-*/package-lock.json tekton-*/yarn.lock
# Keep root yarn.lock - it manages all workspaces!
yarn install
```

#### Yarn Workspaces Rules
- ✅ **DO**: Run `yarn install` from root directory only
- ✅ **DO**: Keep only the root `yarn.lock` file  
- ❌ **DON'T**: Run `yarn install` inside workspace directories
- ❌ **DON'T**: Create `yarn.lock` or `package-lock.json` in workspaces
- ❌ **DON'T**: Delete the root `yarn.lock` file

### TypeScript Issues

```bash
# Check TypeScript compilation
cd tekton-pipeline-renderer && npm run typecheck
cd ../tekton-vscode && npm run typecheck

# Clear TypeScript cache
rm -rf tekton-*/dist tekton-*/tsconfig.tsbuildinfo
```

### Git Workflow

```bash
# Before committing
npm run ci

# Before pushing
npm run release:check

# Create feature branch
git checkout -b feature/new-pipeline-component
# Make changes in tekton-pipeline-renderer/
npm run propagate
npm run ci
git add .
git commit -m "feat: add new pipeline component"
```

---

## 💡 Pro Tips

1. **Always start with the sample app** - It's the fastest way to see your changes
2. **Use the cursor rules** - They enforce the correct workflow
3. **Propagate frequently** - Don't let the packages drift
4. **Test both packages** - Renderer tests + VSCode extension tests
5. **Version bump both packages** - Keep them in sync

Happy coding! 🚀 