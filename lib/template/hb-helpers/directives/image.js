import {kvToHtml} from './util.js';

/**
 * @param value {string} expected to in the format img:{{uuid}}.{{extension}}
 * @param params {Object} key value parameters taken from the handlebars template
 */
export default function render(value, params) {
    if (!value) {
        return undefined;
    }

    let url = value;
    if (!value.startsWith) {
        console.warn('strange type for img value', typeof value, value);
        return undefined;
    }

    if (value.startsWith('img:')) {
        const imgId = value.substr(4);
        url = getFirebaseStorageUrl(imgId);
    }


    let urlParams = Object.assign({}, params);
    // console.log(urlParams, params);
    urlParams.query = params.lorem_query;
    urlParams.w = params.width;
    urlParams.h = params.height;
    urlParams.lock = hashObject(params, ['width', 'height', 'class', 'style']);
    url += buildUrlQuery(urlParams, ['w', 'h', 'lock', 'query']);

    if (params.tag === 'false' || params.tag === false) {
        return url;
    }

    const paramsStr = kvToHtml(params, ['class', '@click', 'style', 'width', 'height']);
    return `<img src="${url}" ${paramsStr} />`;
}

function buildUrlQuery(params, whitelist = undefined) {
    let url = '';

    if (Object.keys(params).length > 0) {
        url += '?';
        url += Object.entries(params).filter(kv => {
            const [key, value] = kv;
            if (value === undefined) {return false;}
            if (whitelist === undefined) {return true;}

            if (whitelist.includes(key)) {
                return true;
            }

            return false;
        }).map(kv => {
            let [key, value] = kv;
            value = encodeURIComponent(value);
            // console.log('key, value', key, value);
            return `${key}=${value}`;
        }).join('&');
    }

    return url;
}

function getFirebaseStorageUrl(imgId) {
    return `uploads/${imgId}`;
}

function hashObject(obj, ignoreKeys = []) {
    let s = ''
    for (const [k, v] of Object.entries(obj)) {
        if (ignoreKeys.includes(k)) {
            continue;
        }
        s += `${k}${v}`;
    }
    return hashString(s).toString();
}

function hashString(s) {
    var hash = 0;
    for (var i = 0; i < s.length; i++) {
        var char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
