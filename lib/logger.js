import 'colors'
import path from 'path';

const ARROW = '==>';

/**
 * Decorates console.log statements with colors and symbols
 */
export default class Logger {
    /**
     * @static
     *
     * General information messages in bold blue, with ==> arrow
     *
     * @param {string} str
     */
    static info(str) {
        console.log(`${ARROW.blue} ${str}`.bold);
    }

    /**
     * @static
     *
     * Warnings in bold yellow
     *
     * @param {string} str
     */
    static warn(str) {
        console.log(`WARNING: ${str}`.bold.yellow);
    }

    /** @static
     *
     * Tagged information
     *
     * @param {string} tag
     * @param {string} str
     */
    static tagged(tag, str, color = 'yellow') {
        const formattedTag = `[${tag}]`[color];
        console.log(`  ${formattedTag} ${str}`);
    }

    /**
     * @static
     *
     * Errors in bold red
     *
     * @param {string} err
     */
    static error(err) {
        console.log(`ERROR: ${err}`.bold.red);
    }

    /**
     * @static
     *
     * Additional information with generic formatting, line returns
     */
    static extra() {
        const params = Array.from(arguments);
        // let params = Array.isArray(lines) ? lines : [lines];
        params.unshift(`[${_getCallerFile()}]`);
        console.log(...params)
    }
}

function _getCallerFile() {
    // const pkgJsonDir = path.dirname(module.paths[0]);

    var filename;

    var _pst = Error.prepareStackTrace
    Error.prepareStackTrace = function (err, stack) {return stack;};
    try {
        var err = new Error();
        var callerfile;
        var currentfile;

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if (currentfile !== callerfile) {
                filename = callerfile;
                break;
            }
        }
    } catch (err) {}
    Error.prepareStackTrace = _pst;
    return callerfile.split('/').slice(-3).join('/');
}

export async function dolog(desc, fn) {
    Logger.info(`${desc}`);
    await fn();
    Logger.info(`[Done] ${desc}`);
}
