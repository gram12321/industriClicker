const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (process.env.NODE_ENV !== 'production' && moduleName.endsWith('/game/finance/financeConstants')) {
    return context.resolveRequest(context, './financeConstants.dev', platform);
  }

  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

// DocumentationDialog loads bundled Markdown and Expo SQLite on web loads WebAssembly.
config.resolver.assetExts.push('md', 'wasm');

// The SQLite web worker requires cross-origin isolation for SharedArrayBuffer.
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(request, response, next);
};

module.exports = config;
