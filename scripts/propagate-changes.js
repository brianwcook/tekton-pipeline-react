#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RENDERER_DIR = path.join(__dirname, '..', 'tekton-pipeline-renderer');
const VSCODE_DIR = path.join(__dirname, '..', 'tekton-vscode');

console.log('🔄 Propagating changes from tekton-pipeline-renderer to tekton-vscode...');

/**
 * Update the VSCode extension's dependency on the renderer package
 */
function updateVSCodeDependency() {
  console.log('📦 Updating VSCode extension dependency...');
  
  const vscodePackagePath = path.join(VSCODE_DIR, 'package.json');
  const rendererPackagePath = path.join(RENDERER_DIR, 'package.json');
  
  if (!fs.existsSync(vscodePackagePath) || !fs.existsSync(rendererPackagePath)) {
    throw new Error('Package.json files not found');
  }
  
  const vscodePackage = JSON.parse(fs.readFileSync(vscodePackagePath, 'utf8'));
  const rendererPackage = JSON.parse(fs.readFileSync(rendererPackagePath, 'utf8'));
  
  // Update the workspace dependency reference
  const rendererName = rendererPackage.name;
  if (vscodePackage.dependencies && vscodePackage.dependencies[rendererName]) {
    vscodePackage.dependencies[rendererName] = `file:../tekton-pipeline-renderer`;
    console.log(`✅ Updated ${rendererName} dependency to use workspace format`);
  }
  
  // Sync version numbers
  if (rendererPackage.version !== vscodePackage.version) {
    console.log(`🔄 Syncing version: ${vscodePackage.version} -> ${rendererPackage.version}`);
    vscodePackage.version = rendererPackage.version;
  }
  
  fs.writeFileSync(vscodePackagePath, JSON.stringify(vscodePackage, null, 2) + '\n');
}

/**
 * Copy shared sample files if they exist
 */
function syncSampleFiles() {
  console.log('📁 Syncing sample files...');
  
  const rendererSamplesDir = path.join(RENDERER_DIR, 'samples');
  const vscodeSamplesDir = path.join(VSCODE_DIR, 'samples');
  
  if (fs.existsSync(rendererSamplesDir)) {
    if (!fs.existsSync(vscodeSamplesDir)) {
      fs.mkdirSync(vscodeSamplesDir, { recursive: true });
    }
    
    const sampleFiles = fs.readdirSync(rendererSamplesDir);
    sampleFiles.forEach(file => {
      const srcPath = path.join(rendererSamplesDir, file);
      const destPath = path.join(vscodeSamplesDir, file);
      
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied sample: ${file}`);
      }
    });
  }
}

/**
 * Recursively copy directory using Node.js (cross-platform)
 */
function copyDirectorySync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Recursively remove directory using Node.js (cross-platform)
 */
function removeDirectorySync(dir) {
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        removeDirectorySync(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    
    fs.rmdirSync(dir);
  }
}

/**
 * Bundle the renderer package directly into VSCode extension
 */
function bundleRendererCode() {
  console.log('📦 Bundling renderer code into VSCode extension...');
  
  const rendererSrcDir = path.join(RENDERER_DIR, 'src');
  const vscodeLibDir = path.join(VSCODE_DIR, 'src', 'lib', 'tekton-renderer');
  
  console.log(`🔍 Source directory: ${rendererSrcDir}`);
  console.log(`🔍 Target directory: ${vscodeLibDir}`);
  
  // Verify source directory exists
  if (!fs.existsSync(rendererSrcDir)) {
    throw new Error(`❌ Renderer source directory not found: ${rendererSrcDir}`);
  }
  
  // Remove existing bundled code using Node.js
  if (fs.existsSync(vscodeLibDir)) {
    console.log('🧹 Removing existing bundled code...');
    removeDirectorySync(vscodeLibDir);
  }
  
  // Create lib directory
  const libParentDir = path.join(VSCODE_DIR, 'src', 'lib');
  if (!fs.existsSync(libParentDir)) {
    console.log(`📁 Creating lib directory: ${libParentDir}`);
    fs.mkdirSync(libParentDir, { recursive: true });
  }
  
  console.log(`📁 Creating target directory: ${vscodeLibDir}`);
  fs.mkdirSync(vscodeLibDir, { recursive: true });
  
  // Copy renderer source code (excluding extension-specific files)
  const filesToCopy = [
    'components',
    'factories',
    'hooks', 
    'types',
    'utils',
    'index.ts'
  ];
  
  filesToCopy.forEach(item => {
    const srcPath = path.join(rendererSrcDir, item);
    const destPath = path.join(vscodeLibDir, item);
    
    if (fs.existsSync(srcPath)) {
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirectorySync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      console.log(`✅ Bundled: ${item}`);
    } else {
      console.warn(`⚠️  Source path not found: ${srcPath}`);
    }
  });
  
  // Create a bundled index file
  const bundledIndexContent = `
// Auto-generated bundled export from tekton-pipeline-renderer
// DO NOT EDIT - This file is generated by the propagate script

export * from './components';
export * from './hooks';
export * from './types';
export * from './utils';
`;
  
  fs.writeFileSync(path.join(vscodeLibDir, 'index.ts'), bundledIndexContent);
  console.log('✅ Created bundled index file');
  
  // Verify the bundled files exist
  console.log('🔍 Verifying bundled files...');
  const createdFiles = fs.readdirSync(vscodeLibDir);
  console.log('📁 Created files/directories:', createdFiles.join(', '));
  
  // Check if index.ts exists and has content
  const indexPath = path.join(vscodeLibDir, 'index.ts');
  if (fs.existsSync(indexPath)) {
    const indexSize = fs.statSync(indexPath).size;
    console.log(`✅ index.ts created successfully (${indexSize} bytes)`);
  } else {
    throw new Error('❌ index.ts was not created properly');
  }
  
  // Final verification that the directory structure matches what webpack expects
  console.log('🔍 Final verification of bundled structure:');
  try {
    const vscodeWebviewDir = path.join(VSCODE_DIR, 'src', 'webview');
    const relativePathToLib = path.relative(vscodeWebviewDir, vscodeLibDir);
    console.log(`   From webview dir: ${vscodeWebviewDir}`);
    console.log(`   To lib dir: ${vscodeLibDir}`);
    console.log(`   Relative path: ${relativePathToLib}`);
    console.log(`   Expected import: '../lib/tekton-renderer'`);
    
    if (relativePathToLib !== '../lib/tekton-renderer') {
      console.warn(`⚠️  Path mismatch! Expected '../lib/tekton-renderer', got '${relativePathToLib}'`);
    } else {
      console.log('✅ Import path verification passed');
    }
  } catch (pathError) {
    console.warn('⚠️  Could not verify import paths:', pathError.message);
  }
}

/**
 * Update VSCode extension to use bundled code instead of external dependency
 */
function updateToBundledImports() {
  console.log('🔄 Updating VSCode extension to use bundled imports...');
  
  const vscodePackagePath = path.join(VSCODE_DIR, 'package.json');
  const vscodePackage = JSON.parse(fs.readFileSync(vscodePackagePath, 'utf8'));
  
  // Remove the external dependency since we're bundling
  if (vscodePackage.dependencies && vscodePackage.dependencies['tekton-pipeline-renderer']) {
    delete vscodePackage.dependencies['tekton-pipeline-renderer'];
    console.log('✅ Removed external renderer dependency');
  }
  
  fs.writeFileSync(vscodePackagePath, JSON.stringify(vscodePackage, null, 2) + '\n');
}

/**
 * Run post-propagation checks
 */
function runChecks() {
  console.log('🔍 Running post-propagation checks...');
  
  try {
    // Check if the VSCode extension can resolve dependencies
    process.chdir(VSCODE_DIR);
    console.log('🔄 Checking dependencies...');
    execSync('yarn install --check-files', { stdio: 'inherit' });
    console.log('✅ VSCode extension dependencies are valid');
    
    // Check TypeScript compilation
    console.log('🔄 Building VSCode extension...');
    execSync('yarn run build', { stdio: 'inherit' });
    console.log('✅ VSCode extension builds successfully with bundled code');
    
  } catch (error) {
    console.error('❌ Post-propagation checks failed:');
    console.error('Error message:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout.toString());
    if (error.stderr) console.error('STDERR:', error.stderr.toString());
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🚀 Using COPY propagation mode (self-contained extension)');
    
    // Debug environment info for CI troubleshooting
    console.log('🔍 Environment debug info:');
    console.log(`   Working directory: ${process.cwd()}`);
    console.log(`   Renderer dir: ${RENDERER_DIR}`);
    console.log(`   VSCode dir: ${VSCODE_DIR}`);
    console.log(`   Renderer src exists: ${fs.existsSync(path.join(RENDERER_DIR, 'src'))}`);
    console.log(`   VSCode src exists: ${fs.existsSync(path.join(VSCODE_DIR, 'src'))}`);
    
    bundleRendererCode();
    updateToBundledImports();
    syncSampleFiles();
    runChecks();
    
    console.log('✅ Successfully propagated changes to VSCode extension');
    console.log('💡 Next steps: Run "npm run test" to verify everything works');
    
  } catch (error) {
    console.error('❌ Failed to propagate changes:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  updateVSCodeDependency,
  syncSampleFiles,
  bundleRendererCode,
  updateToBundledImports,
  runChecks
}; 