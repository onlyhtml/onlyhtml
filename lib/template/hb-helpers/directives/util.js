export const DefaultExportedKeys = ['class', ':class', 'x-on:click', 'style', 'dir'];

export function kvToHtml(kv, whitelist = undefined, blacklist = []) {
    let empty = true;
    let s = Object.entries(kv || {}).map(pair => {
        const [key, value] = pair;

        if (blacklist.includes(key)) {
            return '';
        }

        if (whitelist && whitelist.includes(key) === false) {
            return '';
        }

        empty = false;
        return `${key}=${quoteIfNeeded(value)}`
    }).join(' ');

    if (!empty) {
        s = ' ' + s;
    }
    
    return s;
}

function quoteIfNeeded(v) {
    if (typeof v === 'number') {
        return v.toString();
    }

    return `"${v}"`;
}
