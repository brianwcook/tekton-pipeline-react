# 🤖 AI Assistant Workflow Guide

**Quick reference for AI assistants working on this codebase**

## 🎯 Architecture Summary

**Single Source of Truth**: All pipeline rendering logic lives in `tekton-pipeline-renderer/`

**Propagation**: Changes copy from `tekton-pipeline-renderer/src/` → `tekton-vscode/src/lib/tekton-renderer/`

**Testing**: Both packages have independent test suites + integration tests

## 🚨 Critical Rules

1. **NEVER** add rendering logic to `tekton-vscode/src/` (except extension-specific code)
2. **NEVER** edit `tekton-vscode/src/lib/` (auto-generated by propagation)
3. **ALWAYS** implement features in `tekton-pipeline-renderer/` first
4. **ALWAYS** run `npm run propagate` after renderer changes

## 🔄 Standard Workflow

### Making Changes to Pipeline Rendering:
```bash
# 1. Edit files in tekton-pipeline-renderer/src/
# 2. Test the renderer
npm run test:renderer

# 3. Propagate to VSCode extension
npm run propagate

# 4. Test the extension
npm run test:vscode

# 5. Verify complete pipeline
npm run pre-push
```

### Before Pushing to GitHub:
```bash
npm run pre-push
# This runs: lint + build:renderer + build:extension + vscode:package
```

## 📁 Where to Edit What

### ✅ Edit in `tekton-pipeline-renderer/src/`:
- React components (`components/`)
- Custom hooks (`hooks/`)
- Utilities and parsers (`utils/`)
- Type definitions (`types/`)
- Tests (`__tests__/`)

### ✅ Edit in `tekton-vscode/src/`:
- Extension entry point (`extension.ts`)
- VSCode webview integration (`webview/`)
- Extension tests (`test/`)
- Extension configuration (`package.json`, etc.)

### ❌ NEVER Edit:
- `tekton-vscode/src/lib/` (auto-generated)

## 🧪 Testing Commands

```bash
npm run test              # All tests
npm run test:renderer     # Renderer package only
npm run test:vscode       # VSCode extension only
npm run sample           # Interactive React demo
```

## 🔧 Key Commands

```bash
npm run propagate        # Copy renderer changes to VSCode
npm run pre-push         # Complete GitHub Actions equivalent
npm run build           # Build both packages
npm run vscode:package  # Create .vsix file
npm run clean           # Clean all artifacts
```

## 🐛 Common Issues

**"TypeScript build errors after propagation"**
→ Check for conflicting type definitions, run `npm run propagate` again

**"Tests pass locally but GitHub Actions fails"**
→ Run `npm run pre-push` to match GitHub Actions exactly

**"VSCode extension not updating"**
→ Run `npm run propagate` then rebuild extension

## 📋 Commit Checklist

- [ ] Changes implemented in `tekton-pipeline-renderer/`
- [ ] Tests added/updated for new functionality
- [ ] `npm run propagate` executed
- [ ] `npm run pre-push` passes (lint, build, package)
- [ ] Manual testing with sample pipelines

## 🎯 Architecture Goals

- **No Drift**: Single source prevents package divergence
- **Reusability**: Renderer can be used in other contexts
- **Testing**: Comprehensive coverage at all levels
- **Distribution**: Both npm package and VSCode extension from same source 