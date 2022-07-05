import {DefaultExportedKeys, kvToHtml} from "./util.js";

const AllowedKeys = ['controls', 'loop', 'preload', 'playsinline', 'controlsList'].concat(DefaultExportedKeys);

export default function render(value='', params={}) {
    console.log('value', value);

    if (typeof value !== "string") {
        console.warn("got non string object",  value)
        return
    }

    if (!value.startsWith('mux:')) {
        throw new Error('only mux video provider implemented');
    }

    const playbackID = value.substr(4);
    const url = getUrl(playbackID, TYPE_VIDEO);
    if (params.tag === 'false' || params.tag === false) {
        return url;
    }

    let paramsStr = kvToHtml(params || {}, AllowedKeys);
    if (isValidThumbType(params.poster)) {
        const posterUrl = getUrl(playbackID, params.poster || TYPE_THUMB_IMAGE);
        paramsStr += ` poster="${posterUrl}"`
    }

    console.log('video url', url);
    return `<video src="${url}" ${paramsStr}></video>`;
}

const TYPE_VIDEO = 'video';
const TYPE_THUMB_IMAGE = 'image';
const TYPE_THUMB_GIF = 'gif';

function isValidThumbType(type) {
    return type == TYPE_THUMB_GIF || type == TYPE_THUMB_IMAGE;
}

function getUrl(playbackID, type) {
    // TODO width, height 
    // see https://docs.mux.com/guides/video/get-images-from-a-video#get-an-animated-gif-from-a-video

    switch(type) {
        case TYPE_VIDEO:
            return `https://stream.mux.com/${playbackID}.m3u8`;
        case TYPE_THUMB_GIF:
            return `https://image.mux.com/${playbackID}/animated.gif`;
        case TYPE_THUMB_IMAGE:
            return `https://image.mux.com/${playbackID}/thumbnail.png`;
    }

    return undefined;
}
