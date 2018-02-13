let cache = {};

class MsntCachedCssLoader {
  constructor(params) {}

  apply(compiler) {
    compiler.plugin('invalid', (fileName, changeTime) => {
      for (var i in cache) {
        // remove cache for changed file
        if (i === fileName) {
          delete cache[i];
          continue;
        }
        
        // clear cache only for entry files
        if (!i.includes('src\\css\\pages')) continue;
        
        delete cache[i];
      }
    });

    compiler.plugin('this-compilation', compilation => {
      compilation.plugin('succeed-module', module => {
        const resource = module.resource,
              fileDependencies = module.fileDependencies;

        // we are only interested in ".css" files
        if (!resource || !resource.endsWith('.css')) return;

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