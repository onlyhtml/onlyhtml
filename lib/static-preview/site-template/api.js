// Api exposes the handlebars template over `postMessage` for external users outside the preview iframe
class Api {
    constructor(template) {
        this.template = template;
    }

    listen() {
        window.addEventListener("message", (event) => {
            this.onMessage(event.data);
        });
    }

    onMessage(data) {
        console.log('got message', data);
        const html = this.template(data)

        navigator.locks.request('render', async _lock => {
            console.log('aquired lock');
            const parser = new DOMParser();
            const virtualDOM = parser.parseFromString(html, 'text/html');
            console.log('parsed new html');

            // using replaceChildren instead of document.write ensures our script is still alive 
            // and can respond to postMessage calls.
            window.document.head.replaceChildren(...virtualDOM.head.children);
            window.document.body.replaceChildren(...virtualDOM.body.children);

            // make sure all attributes of body are persisted from template,
            // for example class attribute.
            removeAllAttributes(window.document.body);
            for (const attrName of virtualDOM.body.getAttributeNames()) {
                window.document.body.setAttribute(attrName, virtualDOM.body.getAttribute(attrName));
            }

            console.log('inserted new');
        });
    }
}

function removeAllAttributes(elem) {
    while (elem.attributes.length > 0) {
        elem.removeAttributeNode(elem.attributes[0]);
    }
}
