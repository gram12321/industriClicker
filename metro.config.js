const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// DocumentationDialog loads bundled Markdown and Expo SQLite on web loads WebAssembly.
config.resolver.assetExts.push('md', 'wasm');

// The SQLite web worker requires cross-origin isolation for SharedArrayBuffer.
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(request, response, next);
};

module.exports = config;
