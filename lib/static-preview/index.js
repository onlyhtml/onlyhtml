import path from 'path';
import Logger, {dolog} from '../logger.js';
import JSCompiler from '../build/javascript.js';
import CSSCompiler from '../build/stylesheet.js';
import TemplateBuilder from './template.js';
import RuntimeBuilder from './runtime.js';

export async function buildPreview() {
    Logger.info("Getting ready to build...");

    const dist = path.resolve('dist');
    const www = path.resolve('www');
    const javascripts = path.join(www, 'javascripts');
    const stylesheets = path.join(www, 'stylesheets');
    const partials = path.join(www, 'parts');

    const templateBuilder = new TemplateBuilder();
    const runtimeBuilder = new RuntimeBuilder(partials, dist);
    const jscompiler = new JSCompiler(dist);
    const csscompiler = new CSSCompiler(process.cwd(), dist);

    const tasks = [];
    tasks.push(dolog('Building JS', async () => {await jscompiler.compileDirectory(javascripts);}));
    tasks.push(dolog('Building CSS', async () => {await csscompiler.compileDirectory(stylesheets);}));
    tasks.push(dolog('Building Templates', async () => {await templateBuilder.buildTemplates(dist)}));
    tasks.push(dolog('Building Handlebars Preview', async () => { await runtimeBuilder.buildRuntime() }))


    await Promise.all(tasks);
    Logger.info('Done!');

    process.exit(0);
}
