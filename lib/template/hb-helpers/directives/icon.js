import { DefaultExportedKeys, kvToHtml } from './util.js';

export default function render(value, params = {}) {
    const classes = [];
    const icon = value || params.default;
    const htmlParams = kvToHtml(params || {}, DefaultExportedKeys, ['class']);

    classes.push('fas', `fa-${icon}`);

    if (params.class) {
        classes.push(params.class);
    }



    return `<i class="${classes.join(' ')}"${htmlParams}></i>`;
}
