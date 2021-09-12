import { DefaultExportedKeys, kvToHtml } from './util.js';

export default function render(value, params = {}) {
    // TODO implement quill rendering here instead of on dashboard

    params.class = params.class || '';
    params.class += ' ql-editor';
    params.class = params.class.trim();
    const htmlParams = kvToHtml(params || {}, DefaultExportedKeys);

    return `<div${htmlParams}>${value}</div>`;
}
