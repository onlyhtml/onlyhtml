import path from 'path';
import fs from 'fs';

import Logger from '../logger.js';
import TemplateParser from '../parser.js';

export async function pushLocalSanityio(outputPath = 'interneto.pkg.js') {
    const www = path.join(process.cwd(), 'www');
    const parser = new TemplateParser(www);
    const blocks = Array.from(parser.parseAll() || []);
    fs.writeFileSync(outputPath, `export default ${JSON.stringify(blocks, undefined, 4)};`);
    Logger.info('Parsing Template');
}
