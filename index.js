let cache = {};
let clearCacheFlag = true;

class MsntCachedCssLoader {
  constructor(params) {}

  apply(compiler) {
    compiler.plugin('invalid', (fileName, changeTime) => {
      const temp = this;

      // flag to prevent clear cache on first build
      // this way extract-text-webpack-plugin won't recompile CSS files
      clearCacheFlag = !clearCacheFlag;
      if (!clearCacheFlag) return;

      cache = {};
    });

    compiler.plugin('this-compilation', compilation => {
      compilation.plugin('succeed-module', module => {
        const resource = module.resource,
              fileDependencies = module.fileDependencies;

        // we are only interested in ".css" files
        if (!resource.endsWith('.css')) return;

        const source = module._source.source();

        if (source === '// removed by extract-text-webpack-plugin') return;
        
        // store processed source and dependcies, we will need them later
        cache[resource] = {
          source: module._source.source(),
          fileDependencies,
        }
      });
    });
  }

  static default(content, map) {
    return content;
  }

  static pitch() {
    const cachedResult = cache[this.resourcePath];

    if (cachedResult) {
      // we need reset index to prevent css-loader on importLoaders
      // if we already have processed result
      this.loaderIndex = 0;

      // we need to set file depencies for webpack to watch imports
      cachedResult.fileDependencies.forEach(dependency => {
        this.addDependency(dependency);
      });
    }

    return cachedResult ? cachedResult.source : cachedResult;
  }
}

module.exports = {
  default: MsntCachedCssLoader.default,
  pitch: MsntCachedCssLoader.pitch,
  plugin: MsntCachedCssLoader
}