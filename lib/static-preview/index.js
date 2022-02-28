import path from 'path';
import Logger, {dolog} from '../logger.js';
import JSCompiler from '../build/javascript.js';
import CSSCompiler from '../build/stylesheet.js';
import TemplateBuilder from './template.js'

import {fileURLToPath} from 'url';
import {dirname} from 'path';

export async function buildPreview() {
    Logger.info("Getting ready to build...");

    const dist = path.resolve('dist');
    const www = path.resolve('www');
    const javascripts = path.join(www, 'javascripts');
    const stylesheets = path.join(www, 'stylesheets');

    const templateHandler = new TemplateBuilder();
    const jscompiler = new JSCompiler(dist);
    const csscompiler = new CSSCompiler(process.cwd(), dist);

    const tasks = [];
    tasks.push(dolog('Building HTML', async () => {await templateHandler.build(dist)}));
    tasks.push(dolog('Building JS', async () => {await jscompiler.compileDirectory(javascripts);}));
    tasks.push(dolog('Building CSS', async () => {await csscompiler.compileDirectory(stylesheets);}));

    jscompiler.compile(
        path.resolve(curretSourceCodeDirectory(), '../template/hb-helpers/index'),
        path.join(dist, 'hb-helpers.js'),
        {globalName: 'Helpers'},
    );


    await Promise.all(tasks);
    Logger.info('Done!');

    process.exit(0);
}

function curretSourceCodeDirectory() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return __dirname;
}
