import image from './image.js';
import choice from './choice.js';
import date from './date.js';
import editor from './editor.js';
import video from './video.js';
import icon from './icon.js';
import link from './link.js';

export default class RenderHelpers {
    /**
     * @param type {String} type of helper wanted
     * @returns {Function}
     */
    static getHelper(type = 'text') {
        switch (type) {
            case 'image':
                return image;
            case 'choice':
                return choice;
            case 'date':
                return date;
            case 'video':
                return video;
            case 'editor':
            case 'html':
                return editor;
            case 'icon':
                return icon;
            case 'link':
                return link;
            case 'text':
                return function(value, _params) { return value }
        }

        console.log('Unknown type', type);
        return function(v) { return v; }
    }

}
