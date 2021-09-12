import fs from 'fs';
import tailwindjit from '@tailwindcss/jit';
import sharedState from '@tailwindcss/jit/src/lib/sharedState.js';
import deepmerge from 'deepmerge';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import rfdc from 'rfdc';
const clone = rfdc({ proto: true});

export default async function getTailwind(www, tailwindConfigPath) {
    // hack to make tailwind watch for filechanges without setting the env directly
    sharedState.env.TAILWIND_MODE = 'watch'; 
    // sharedState.env.DEBUG = '1';
   
    let conf = {
        purge: [`${www}/**/*.html`],
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

    console.log('pulled tailwind config');
    return tailwindjit(conf);
}
