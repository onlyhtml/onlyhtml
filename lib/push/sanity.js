import fs from 'fs';
import path from 'path';

import Logger from '../logger.js';
import TemplateParser from '../parser.js';

export async function pushLocalSanityio(pluginConfigPath = 'interneto.pkg.js') {
    const www = path.join(process.cwd(), 'www');

    Logger.info('Parsing Template');
    const parser = new TemplateParser(www);
    const blocks = Array.from(parser.parseAll() || []);


    Logger.info('Reading Current Configuration');
    const config = getPluginConfig(pluginConfigPath);
    config.blocks = blocks;

    fs.writeFileSync(pluginConfigPath, JSON.stringify(config, undefined, 4));
    Logger.info('Saved Updated Configuration');
}

export async function watchAndPushSanity(pluginConfing) {
    const www = path.join(process.cwd(), 'www');
    fs.watch(www, {recursive: true} , () => {
        Logger.info('www directory changed, updating sanity.io');
        pushLocalSanityio(pluginConfing);
    });
}

function getPluginConfig(_path) {
    let config = {};
    if (fs.existsSync(_path)) {
        config = JSON.parse(fs.readFileSync(_path));
    }

    return config;
}
