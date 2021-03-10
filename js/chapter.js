/**
 * Name: Katie Bankhead
 * Date: Winter 2021
 * Description: Module for chapter updates
 */
/*jslint
    browser, long
*/
/*property
    content, element, forEach, freeze, getElementById, href, id, innerHTML,
    link, numChapters, parentBookId, querySelectorAll, requestChapter,
    setupMarkers, title, tocName, volumeForId
*/

/**----------------------------------------------------
* IMPORTS
*/
import {books} from "./mapScripApi.js";
import Api from "./mapScripApi.js";
import Html from "./htmlHelper.js";
import injectBreadcrumbs from "./breadcrumbs.js";
import MapHelper from "./mapHelper.js";

/**----------------------------------------------------
* CONSTANTS
*/
const CLASS_ICON = "material-icons";
const DIV_NAV_HEADING = "navheading";
const DIV_SCRIPTURES = "scriptures";
const ICON_NEXT = "skip_next";
const ICON_PREVIOUS = "skip_previous";
const TAG_SPAN = "span";

/**----------------------------------------------------
* PRIVATE VARIABLES
*/
let requestedBookId;
let requestedChapter;
let requestedNextPrevious;

/**----------------------------------------------------
* PRIVATE METHODS
*/
const getScripturesCallback = function (chapterHtml) {
    let book = books[requestedBookId];

    document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;

    // next/prev navigation
    document.querySelectorAll(`.${DIV_NAV_HEADING}`).forEach(function (element) {
        element.innerHTML += `<div class="nextprev">${requestedNextPrevious}</div>`;
    });

    // update breadcrumbs
    if (book !== undefined) {
        injectBreadcrumbs(Api.volumeForId(book.parentBookId), book, requestedChapter);
    } else {
        injectBreadcrumbs();
    }

    MapHelper.setupMarkers();
};

const getScripturesFailure = function () {
    document.getElementById(DIV_SCRIPTURES).innerHTML = "Unable to retrieve chapter content from server.";
    injectBreadcrumbs();
};

const navigateChapter = function (bookId, chapter) {
    requestedBookId = bookId;
    requestedChapter = chapter;

    let prev = previousChapter(bookId, chapter);
    let next = nextChapter(bookId, chapter);

    if (prev === undefined) {
        requestedNextPrevious = "";
    } else {
        requestedNextPrevious = nextPreviousMarkup(prev, ICON_PREVIOUS);
    }

    if (next !== undefined) {
        requestedNextPrevious += nextPreviousMarkup(next, ICON_NEXT);
    }

    Api.requestChapter(bookId, chapter, getScripturesCallback, getScripturesFailure);
};

const nextChapter = function (bookId, chapter) {
    let book = books[bookId];

    if (book !== undefined) {
        if (chapter < book.numChapters) {
            return [
                bookId,
                chapter + 1,
                titleForBookChapter(book, chapter + 1)
            ];
        }

        let nextBook = books[bookId + 1];

        if (nextBook !== undefined) {
            let nextChapterValue = 0;
            if (nextBook.numChapters > 0) {
                nextChapterValue = 1;
            }

            return [
                nextBook.id,
                nextChapterValue,
                titleForBookChapter(nextBook, nextChapterValue)
            ];
        }

    }
};

const nextPreviousMarkup = function (nextPrev, icon) {
    return Html.link({
        content: Html.element(TAG_SPAN, icon, CLASS_ICON),
        href: `#0:${nextPrev[0]}:${nextPrev[1]}`,
        title: nextPrev[2]
    });
};

const previousChapter = function (bookId, chapter) {
    let book = books[bookId];

    if (book !== undefined) {
        if (chapter > 1) {
            return [
                bookId,
                chapter - 1,
                titleForBookChapter(book, chapter - 1)
            ];
        }

        let prevBook = books[bookId - 1];

        if (prevBook !== undefined) {
            return [
                bookId - 1,
                prevBook.numChapters,
                titleForBookChapter(prevBook, prevBook.numChapters)
            ];
        }
    }
};

const titleForBookChapter = function (book, chapter) {
    if (book !== undefined) {
        if (chapter > 0) {
            return `${book.tocName} ${chapter}`;
        }

        return book.tocName;
    }
};

/**----------------------------------------------------
* PUBLIC API
*/
export default Object.freeze(navigateChapter);