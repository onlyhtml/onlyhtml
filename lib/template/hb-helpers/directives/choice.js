export default function render(value, params = {}) {

    let options = (params.options || '').split(',');

    if (options.length == 0) {
        options = ['true', undefined];
    } else if (options.length == 1 && options[0] === '') {
        options = ['true', undefined];
    } else if (options.length == 1) {
        options = [options[0], undefined];
    } else {
        options = [options[0], options[1]];
    }

    return isTrue(value) ? options[0] : options[1];
}

function isTrue(value) {
    if (value === 'true') {
        return true;
    }

    if (value === 'false') {
        return false;
    }

    return value !== undefined;
}
