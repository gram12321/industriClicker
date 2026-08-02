const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Expo SQLite on web loads its database engine as WebAssembly.
config.resolver.assetExts.push('wasm');
config.resolver.assetExts.push('md');

// The web SQLite worker requires cross-origin isolation for SharedArrayBuffer.
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(request, response, next);
};

module.exports = config;
