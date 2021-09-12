import strftime from 'strftime';


export default function render(value, params = {}) {
    if (!value) {
        return undefined;
    }

    const format = params.format || '%B %e, %Y';
    const timezone = params.timezone || '+0000';
    const date = new Date(value);
    const _strftime = strftime.timezone(timezone);

    return _strftime(format, date);
}
