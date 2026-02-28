const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

const config = getDefaultConfig(__dirname);

const workspaceRoot = path.resolve(__dirname, '..');
const workspacePackages = path.resolve(workspaceRoot, "packages");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");

config.watchFolders = [workspacePackages].filter((p) => fs.existsSync(p));
config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, "node_modules"),
    ...(fs.existsSync(workspaceNodeModules) ? [workspaceNodeModules] : []),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
