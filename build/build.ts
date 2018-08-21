import { WorkboxBuild, Manifest } from './workbox.types';
import * as fs from 'fs-extra';
import * as uglify from 'uglify-js';
import * as pathmodule from 'path';

const workbox: WorkboxBuild = require('workbox-build');
const outputPath = 'dist/ng-notes';

/**
 * Copy workbox from npm
 */
async function copyWorkbox() {
  const cwd = process.cwd();
  const pkgPath = `${cwd}/node_modules/workbox-sw/package.json`;
  const pkg = require(pkgPath);
  const readPath = `${cwd}/node_modules/workbox-sw/${pkg.main}`;
  const data = fs.readFileSync(readPath, 'utf8');
  const path = `${cwd}/${outputPath}/workbox-sw.js`;
  return [
    { data, path },
    {
      data: fs.readFileSync(`${readPath}.map`, 'utf8'),
      path: `${cwd}/${outputPath}/${pathmodule.basename(pkg.main)}.map`
    }
  ]
}

/**
 * Minify dropdown.js
 */
async function minifiedDropdownJs() {
  const code = fs.readFileSync(process.cwd() + '/src/dropdown.js', 'utf8');
  const data = uglify.minify(code).code;
  const path = process.cwd() + `/${outputPath}/dropdown.js`;
  return [{ data,  path }];
}


/**
 * Build Steps
 *  (assume tsc has ran)
 *  - Copy assets from npm
 *  - Generate SW entries
 *  - Generate SW from entries
 */
async function build() {
  const wb = await copyWorkbox();
  // const dropdown = await minifiedDropdownJs();
  // const all = wb.concat(dropdown);
  await wb.map(file => {
    console.log(`Writing ${file.path}.`);
    return fs.writeFileSync(file.path, file.data, 'utf8');
  });

  return workbox.injectManifest({
    globDirectory: `./${outputPath}/`,
    globPatterns: ['**\/*.{html,js,css,png,jpg,json,svg}'],
    globIgnores: ['build/*', 'sw-default.js', 'workbox-sw.js', 'index.html'],
    swSrc: './src/sw-template.js',
    swDest: `./${outputPath}/sw-default.js`,
  });
}

try {
  build();
} catch(e) {
  console.log(e);
}
