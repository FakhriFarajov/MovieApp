// Load local .env into process.env during config evaluation
// This file is executed by Expo when resolving app configuration.
try {
  // prefer dotenv if available
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch (e) {
  // ignore if dotenv isn't installed; the env may come from the shell or CI
}

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      EXPO_TMDB_API_KEY: process.env.EXPO_TMDB_API_KEY,
    },
  };
};