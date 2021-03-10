/**
 * Name: Katie Bankhead
 * Date: Winter 2021
 */
/*jslint
    browser, long
*/
/*global
    console, map
*/

/**----------------------------------------------------
 * CONSTANTS
 */
const TAG_LIST_ITEM = "li";

/**----------------------------------------------------
* PRIVATE METHODS
*/
const anchor = function (volume) {
    return `<a name="v${volume.id}" />`;
};

const div = function (parameters) {
    let classString = "";
    let contentString = "";
    let idString = "";

    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}" `;
    }

    if (parameters.content !== undefined) {
        contentString = parameters.content;
    }

    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }

    return `<div${idString}${classString}>${contentString}</div>`;
};

const element = function (tagName, content, classValue) {
    let classString = "";

    if (classValue !== undefined) {
        classString = ` class="${classValue}"`;
    }

    return `<${tagName}${classString}>${content}</${tagName}>`;
};

const link = function (parameters) {
    let classString = "";
    let contentString = "";
    let hrefString = "";
    let idString = "";
    let titleString = "";

    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}" `;
    }

    if (parameters.content !== undefined) {
        contentString = parameters.content;
    }

    if (parameters.href !== undefined) {
        hrefString = ` href="${parameters.href}"`;
    }

    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }

    if (parameters.title !== undefined) {
        titleString = ` title="${parameters.title}"`;
    }

    return `<a${idString}${classString}${hrefString}${titleString}>${contentString}</a>`;
};

const listItem = function (content) {
    return element(TAG_LIST_ITEM, content);
};

const listItemLink = function (content, href = "") {
    return listItem(link({content, href: `#${href}`}));
};

/**----------------------------------------------------
* PUBLIC API
*/

const Html = {
    anchor,
    div,
    element,
    link,
    listItem,
    listItemLink
};

export default Object.freeze(Html);