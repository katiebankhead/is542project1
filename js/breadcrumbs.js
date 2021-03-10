/**
 * Name: Katie Bankhead
 * Date: Winter 2021
 * Description: Module for interacting with Google Maps API
 */
/*jslint
    browser, long
*/

/**----------------------------------------------------
* IMPORTS
*/
import Html from "./htmlHelper.js";

/**----------------------------------------------------
* CONSTANTS
*/
const DIV_BREADCRUMBS = "crumbs";
const TAG_UNORDERED_LIST = "ul";
const TEXT_TOP_LEVEL = "The Scriptures";

/**----------------------------------------------------
* PRIVATE VARIABLES
*/

/**----------------------------------------------------
* PRIVATE METHODS
*/
const breadcrumbsHtml = function (volume, book, chapter) {
    let crumbs = "";

    if (volume === undefined) {
        crumbs = Html.listItem(TEXT_TOP_LEVEL);
    } else {
        crumbs = Html.listItemLink(TEXT_TOP_LEVEL);

        if (book === undefined) {
            crumbs += Html.listItem(volume.fullName);
        } else {
            crumbs += Html.listItemLink(volume.fullName, volume.id);

            if (chapter === undefined || chapter <= 0) {
                crumbs += Html.listItem(book.tocName);
            } else {
                crumbs += Html.listItemLink(book.tocName, `#${volume.id}:${book.id}`);
                crumbs += Html.listItem(chapter);
            }
        }
    }

    return Html.element(TAG_UNORDERED_LIST, crumbs);
};

const injectBreadcrumbs = function (volume, book, chapter) {
    document.getElementById(DIV_BREADCRUMBS).innerHTML = breadcrumbsHtml(volume, book, chapter);
};

/**----------------------------------------------------
* PUBLIC API
*/
export default Object.freeze(injectBreadcrumbs);