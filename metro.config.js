const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// resolve .ejs files
config.resolver.assetExts.push('ejs');

// resolve nodejs modules as empty to silence errors from ejs package
config.resolver.extraNodeModules['fs'] = config.resolver.emptyModulePath;
config.resolver.extraNodeModules['path'] = config.resolver.emptyModulePath;

// preserve argument names for dependnecy injection
config.transformer.minifierConfig.mangle = false;

module.exports = config;
