import path from 'path';
import glob from 'glob';
import mkdirp from 'mkdirp';
import esbuild from 'esbuild';

export default class JSCompiler {
    constructor(destinationDirectory) {
        this.destDir = destinationDirectory;
    }

    async compileDirectory(directory) {
        const destJsDir = path.join(this.destDir, 'javascripts');
        await mkdirp(destJsDir);

        const jobs = [];
        glob.sync(`${directory}/*`).forEach(fpath => {
            const fname = path.basename(fpath).split('.')[0];
            const dest = path.join(destJsDir, `${fname}.js`);
            jobs.push(this.compile(fpath, dest));
        });

        await Promise.all(jobs);
    }

    async compile(path, dest, extras = {}) {
        const opts = {
            entryPoints: [path],
            outfile: dest,
            color: true,
            bundle: true,
            platform: 'browser',
        }

        Object.assign(opts, extras)
        await esbuild.build(opts);
    }
}
