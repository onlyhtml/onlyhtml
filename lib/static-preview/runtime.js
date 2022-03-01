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
    }

    async compileHelpers(destFilename) {
        return await this.jscompiler.compile(
            path.resolve(getCurrentSourceDirName(), '../template/hb-helpers/index'),
            path.join(this.out, destFilename),
            {globalName: 'Helpers'},
        );
    }
}
