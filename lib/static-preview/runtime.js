import fs from 'fs';
import path from 'path';
import JSCompiler from "../build/javascript.js";
import {getCurrentSourceDirName} from './dirname.js';

export default class RuntimeBuilder {
    constructor(partials, out) {
        this.out = out;
        this.partials = partials;
        this.jscompiler = new JSCompiler();
    }

    async buildRuntime() {
        await this.compileHelpers('hb-helpers.js')
        this.copyApiFile('api.js');
    }

    async compileHelpers(destFilename) {
        return await this.jscompiler.compile(
            path.resolve(getCurrentSourceDirName(), '../template/hb-helpers/index'),
            path.join(this.out, destFilename),
            {globalName: 'Helpers'},
        );
    }

    copyApiFile(destFilename) {
        const sourcePath = path.resolve(getCurrentSourceDirName(), 'site-template', 'api.js');
        const destPath = path.join(this.out, destFilename);
        const content = fs.readFileSync(sourcePath, 'utf8');
        fs.writeFileSync(destPath, content);
    }
}
