const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Load the real TypeScript modules with injectable external boundaries.
module.exports = function createLoader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const loadedModule = { exports: {} }; cache.set(absolute, loadedModule);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const scopedRequire = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/')) return load(path.resolve(name.slice(2)) + '.ts');
      if (name.startsWith('.')) return load(path.resolve(path.dirname(absolute), name) + '.ts');
      return require(name);
    };
    new Function('require', 'module', 'exports', code)(scopedRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load;
};
