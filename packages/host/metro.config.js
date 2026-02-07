const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Get the root of the monorepo
const root = path.resolve(__dirname, '../..');
const sharedPackage = path.resolve(__dirname, '../shared');
const hostNodeModules = path.resolve(__dirname, 'node_modules');

// Resolve a package name to its real filesystem path (follows Bun's .bun/ symlinks)
const resolvePackage = (name, searchPaths) => {
  for (const searchPath of searchPaths) {
    const candidate = path.resolve(searchPath, name);
    if (fs.existsSync(candidate)) return fs.realpathSync(candidate);
  }
  return path.resolve(searchPaths[0], name);
};

// Resolve @party-kit/host and find its real node_modules for nested deps
const partyKitHostPath = resolvePackage('@party-kit/host', [hostNodeModules, path.resolve(root, 'node_modules')]);
// The resolved host path is like: .../node_modules/@party-kit/host
// Its sibling deps live in the same node_modules directory (2 levels up from the package dir)
const partyKitHostNodeModules = path.resolve(partyKitHostPath, '../..');
const partyKitCorePath = resolvePackage('@party-kit/core', [partyKitHostNodeModules, hostNodeModules, path.resolve(root, 'node_modules')]);

// Watch folders: monorepo root + all real paths Metro needs to access
config.watchFolders = [root, sharedPackage, partyKitHostPath, partyKitCorePath];

// Module resolution paths — include the host's own node_modules inside the .bun/ cache
// so Metro can find all transitive deps (js-sha1, react-native-tcp-socket, etc.)
config.resolver.nodeModulesPaths = [
  hostNodeModules,
  path.resolve(root, 'node_modules'),
  partyKitHostNodeModules,
];

// Enable symlink support for monorepo
config.resolver.unstable_enableSymlinks = true;

// Explicitly map packages for Metro resolution
// This handles Bun's symlink structure and prevents duplicate React instances
config.resolver.extraNodeModules = {
  '@my-game/shared': sharedPackage,
  '@party-kit/host': partyKitHostPath,
  '@party-kit/core': partyKitCorePath,
  // Force single React/RN instance from the host app
  'react': path.resolve(hostNodeModules, 'react'),
  'react-native': path.resolve(hostNodeModules, 'react-native'),
};

module.exports = config;
