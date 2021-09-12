import { DefaultExportedKeys, kvToHtml } from './util.js';

export default function render(value, params = {}) {
    let obj;
    if (typeof value === 'string') {
        obj = JSON.parse(value || '{}');
    } else {
        obj = value || {};
    }

    const text = obj.text || '';
    const href = obj.href || '';

    if (params.tag === false) {
        return href;
    }

    const htmlParams = kvToHtml(params || {}, DefaultExportedKeys);
    return `<a href="${href}"${htmlParams}>${text}</a>`;
}

