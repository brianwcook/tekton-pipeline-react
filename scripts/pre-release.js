#!/usr/bin/env node

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${colors.cyan}🔄 ${description}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`${colors.green}✅ ${description} completed${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed${colors.reset}`);
    log(`Command: ${command}`);
    log(`Error: ${error.message}`);
    return false;
  }
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

function getCurrentVersion(packagePath) {
  try {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    return pkg.version;
  } catch (error) {
    return null;
  }
}

function bumpVersion(packagePath, versionType) {
  try {
    const command = `cd ${packagePath.replace('/package.json', '')} && npm version ${versionType} --no-git-tag-version`;
    execSync(command, { stdio: 'pipe' });
    return getCurrentVersion(packagePath);
  } catch (error) {
    log(`${colors.red}Failed to bump version in ${packagePath}${colors.reset}`);
    return null;
  }
}

async function main() {
  log(`${colors.bright}${colors.magenta}🚀 Tekton Pipeline Combo Pre-Release Automation${colors.reset}`);
  log(`${colors.bright}This script automates the pre-release checklist from DEVELOPMENT.md${colors.reset}\n`);

  // Step 1: Check if we need version bump
  const currentRendererVersion = getCurrentVersion('./tekton-pipeline-renderer/package.json');
  const currentVscodeVersion = getCurrentVersion('./tekton-vscode/package.json');
  
  log(`${colors.blue}📦 Current versions:${colors.reset}`);
  log(`   Renderer: ${currentRendererVersion}`);
  log(`   VSCode:   ${currentVscodeVersion}`);

  const shouldBumpVersion = await promptUser('\n🔢 Do you want to bump the version? (y/n): ');
  
  if (shouldBumpVersion === 'y' || shouldBumpVersion === 'yes') {
    const versionType = await promptUser('📈 Version bump type (patch/minor/major): ');
    
    if (['patch', 'minor', 'major'].includes(versionType)) {
      log(`\n${colors.cyan}🔄 Bumping version (${versionType})...${colors.reset}`);
      
      const newRendererVersion = bumpVersion('./tekton-pipeline-renderer/package.json', versionType);
      const newVscodeVersion = bumpVersion('./tekton-vscode/package.json', versionType);
      
      if (newRendererVersion && newVscodeVersion) {
        log(`${colors.green}✅ Version bumped to ${newRendererVersion}${colors.reset}`);
      } else {
        log(`${colors.red}❌ Version bump failed${colors.reset}`);
        process.exit(1);
      }
    } else {
      log(`${colors.yellow}⚠️  Invalid version type. Skipping version bump.${colors.reset}`);
    }
  }

  // Step 2: Run comprehensive release check (includes CI + propagation + final test)
  if (!execCommand('yarn run release:check', 'Running comprehensive release check')) {
    log(`${colors.red}💥 Release check failed. Please fix issues before proceeding.${colors.reset}`);
    process.exit(1);
  }

  // Step 3: Manual testing instructions
  log(`\n${colors.bright}${colors.yellow}📋 MANUAL TESTING REQUIRED${colors.reset}`);
  log(`${colors.yellow}Please complete these manual steps:${colors.reset}\n`);
  
  log(`${colors.blue}1. Test Sample App:${colors.reset}`);
  log(`   • Run: yarn run sample`);
  log(`   • Test different pipeline configurations`);
  log(`   • Verify visualizations render correctly`);
  
  log(`\n${colors.blue}2. Test VSCode Extension:${colors.reset}`);
  log(`   • cd tekton-vscode && code .`);
  log(`   • Press F5 to launch Extension Development Host`);
  log(`   • Open a .yaml file with Tekton pipeline`);
  log(`   • Right-click → "Visualize Pipeline"`);
  log(`   • Verify webview renders correctly`);

  const testingSatisfied = await promptUser('\n✅ Have you completed all manual testing? (y/n): ');
  
  if (testingSatisfied !== 'y' && testingSatisfied !== 'yes') {
    log(`${colors.yellow}⏸️  Please complete manual testing and run this script again.${colors.reset}`);
    log(`${colors.cyan}💡 To resume testing:${colors.reset}`);
    log(`   • Sample app: yarn run sample`);
    log(`   • VSCode extension: cd tekton-vscode && code . (then F5)`);
    process.exit(0);
  }

  // Step 4: Build packages for release
  if (!execCommand('yarn run build', 'Building both packages')) {
    log(`${colors.red}💥 Build failed. Please fix build issues.${colors.reset}`);
    process.exit(1);
  }

  if (!execCommand('yarn run vscode:package', 'Creating VSCode extension package')) {
    log(`${colors.red}💥 VSCode packaging failed.${colors.reset}`);
    process.exit(1);
  }

  // Success!
  log(`\n${colors.bright}${colors.green}🎉 PRE-RELEASE PREPARATION COMPLETE!${colors.reset}`);
  log(`${colors.green}All automated checks have passed and packages are ready for release.${colors.reset}\n`);
  
  log(`${colors.blue}📦 Next Steps:${colors.reset}`);
  log(`${colors.blue}For NPM Package (Renderer):${colors.reset}`);
  log(`   cd tekton-pipeline-renderer && npm run npm:publish`);
  
  log(`${colors.blue}For VSCode Extension:${colors.reset}`);
  log(`   cd tekton-vscode && npx vsce publish`);
  log(`   (or upload the .vsix file to VSCode Marketplace manually)`);

  const vsixFiles = execSync('find tekton-vscode -name "*.vsix" 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
  if (vsixFiles) {
    log(`${colors.green}📁 VSIX package created: ${vsixFiles}${colors.reset}`);
  }

  log(`\n${colors.cyan}💡 Pro tip: Review DEVELOPMENT.md for detailed release instructions.${colors.reset}`);
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
  log(`\n${colors.yellow}⏸️  Pre-release preparation interrupted.${colors.reset}`);
  log(`${colors.cyan}You can resume by running: npm run pre-release${colors.reset}`);
  process.exit(0);
});

main().catch((error) => {
  log(`${colors.red}💥 Pre-release script failed: ${error.message}${colors.reset}`);
  process.exit(1);
}); 