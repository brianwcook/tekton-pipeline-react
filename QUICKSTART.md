# ⚡ Quick Start Guide

Get up and running with Tekton Pipeline Combo in 5 minutes!

## 🚀 Instant Demo

```bash
# 1. Clone and install (2 minutes)
git clone https://github.com/your-org/tekton-pipeline-combo.git
cd tekton-pipeline-combo
yarn install  # ⚠️ From root only! (manages both packages)

# 2. Start the interactive demo (1 minute) 
npm run sample
# Opens http://localhost:3000
```

**🎉 You now have a live pipeline visualization running!**

## 🎯 What You'll See

The sample app opens with:
- **Left Panel**: YAML editor with a sample pipeline
- **Right Panel**: Interactive pipeline visualization
- **Live Rendering**: Edit YAML → See changes instantly

## 🧪 Try These Examples

### 1. Simple Linear Pipeline
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: simple-build
spec:
  pipelineSpec:
    tasks:
    - name: fetch-source
      taskRef:
        name: git-clone
    - name: build-image
      taskRef:
        name: buildah
      runAfter: [fetch-source]
    - name: deploy
      taskRef:
        name: kubectl-deploy
      runAfter: [build-image]
```

### 2. Parallel Execution
```yaml
apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: parallel-pipeline
spec:
  pipelineSpec:
    tasks:
    - name: fetch-source
      taskRef:
        name: git-clone
    - name: unit-tests
      taskRef:
        name: run-tests
      runAfter: [fetch-source]
    - name: security-scan
      taskRef:
        name: security-check
      runAfter: [fetch-source]
    - name: deploy
      taskRef:
        name: deploy-app
      runAfter: [unit-tests, security-scan]
```

## 🔄 Test the Propagation Workflow

```bash
# 1. Make a change in the renderer (2 minutes)
cd tekton-pipeline-renderer
# Edit any file in src/components/

# 2. See it immediately in the sample app
npm run sample  # Already running? Just refresh the browser

# 3. Propagate to VSCode extension (development mode)
cd ..
npm run propagate

# 4. Test the VSCode extension
npm run test:vscode

# 5. For release, use bundle mode
npm run propagate:bundle
```

## 🧪 Test Everything

```bash
# Run the complete CI pipeline (3 minutes)
npm run ci

# If everything passes, you're ready to develop! ✅
```

## 🎨 VSCode Extension Demo

```bash
# 1. Package the extension
npm run vscode:package

# 2. Install it in VSCode
code --install-extension tekton-vscode/tekton-pipeline-visualizer-*.vsix

# 3. Open any YAML file in VSCode
# 4. Right-click → "Visualize Pipeline"
```

## 🚀 Development Cycle

```bash
# Your typical development workflow:

# 1. Start the sample app
npm run sample

# 2. Make changes in tekton-pipeline-renderer/
# 3. See changes live in browser
# 4. When ready, propagate
npm run propagate          # Development mode
npm run propagate:bundle   # Release mode (true bundling)

# 5. Test everything
npm run test

# 6. Commit and push
git add .
git commit -m "feat: your awesome feature"
```

## 🎯 What's Happening Under the Hood

```
┌─ tekton-pipeline-renderer/  ← Your code changes here
│  ├─ React components
│  ├─ TypeScript types  
│  └─ Tests
│
├─ scripts/propagate-changes.js  ← Syncs everything
│
└─ tekton-vscode/  ← Gets updated automatically
   ├─ Uses renderer as dependency
   └─ VSCode-specific wrapper
```

## 💡 Key Commands to Remember

| Command | When to Use |
|---------|-------------|
| `npm run sample` | Test changes immediately |
| `npm run propagate` | After renderer changes (development) |
| `npm run propagate:bundle` | For release builds (true bundling) |
| `npm run ci` | Before committing |
| `npm run test` | All the time! |
| `npm run vscode:package` | Create VSCode extension |

## 🆘 Something Not Working?

### Quick Fixes

```bash
# Clean slate
npm run clean && yarn install

# Just propagation issues
npm run propagate

# VSCode extension not loading
cd tekton-vscode && npm run build
```

### Get Help

1. Check [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed workflows
2. Review [.cursorrules](./.cursorrules) for architecture guidelines
3. Look at existing code in `tekton-pipeline-renderer/src/`

## 🎉 You're Ready!

You now have:
- ✅ A unified monorepo with single source of truth
- ✅ Interactive development environment
- ✅ Automated propagation between packages
- ✅ Complete test coverage
- ✅ VSCode extension that stays in sync

**Go build amazing pipeline visualizations!** 🚀

---

### Next Steps
- Read [README.md](./README.md) for complete documentation
- Check [DEVELOPMENT.md](./DEVELOPMENT.md) for advanced workflows
- Explore the sample app to understand the architecture
- Start building your first pipeline component!

Happy coding! 👨‍💻👩‍💻 