import fs from 'fs';
import tailwindcss from 'tailwindcss';
import deepmerge from 'deepmerge';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import rfdc from 'rfdc';
const clone = rfdc({ proto: true});

export default async function getTailwind(www, tailwindConfigPath) {
    let conf = {
        purge: [`${www}/**/*.html`],
        mode: 'jit',
    };

    if (tailwindConfigPath && fs.existsSync(tailwindConfigPath)) {
        // hack to allow re-importing tailwind.config.js
        // see https://github.com/tailwindlabs/tailwindcss/pull/77
        // seems to not work when changing styles and then coming back to a previously used value,
        // probably a tailwind-jit bug that will fixed on a stable release
        delete require.cache[tailwindConfigPath];
        let twconf = clone(require(tailwindConfigPath));
        conf = deepmerge(conf, twconf);
    }

    return tailwindcss(conf);
}
