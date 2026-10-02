const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Prevent Metro from crawling non-app directories and logs
config.resolver.blockList = [
  /.*[/\\]apps[/\\]backend[/\\].*/,
  /.*[/\\]\.git[/\\].*/,
  /.*[/\\]\.agents[/\\].*/,
  /.*[/\\]\.gemini[/\\].*/,
];

// Ensure Metro watches the monorepo root and resolves hoisted dependencies
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './app/global.css' });