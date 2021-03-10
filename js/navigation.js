/**
 * Name: Katie Bankhead
 * Date: Winter 2021
 * Description: Navigation module (for volumes, books)
 */
/*jslint
    browser, long
*/

/**----------------------------------------------------
* IMPORTS
*/
import {books} from "./mapScripApi.js";
import {volumes} from "./mapScripApi.js";
import Api from "./mapScripApi.js";
import Html from "./htmlHelper.js";
import injectBreadcrumbs from "./breadcrumbs.js";
import MapHelper from "./mapHelper.js";
import navigateChapter from "./chapter.js";

/**----------------------------------------------------
* CONSTANTS
*/
const BOTTOM_PADDING = "<br /><br />";
const CLASS_BOOKS = "books";
const CLASS_BUTTON = "btn";
const CLASS_CHAPTER = "chapter";
const CLASS_VOLUME = "volume";
const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
const DIV_SCRIPTURES = "scriptures";
const TAG_HEADERS = "h5";

/**----------------------------------------------------
* PRIVATE VARIABLES
*/

/**----------------------------------------------------
* PRIVATE METHODS
*/
const bookChapterValid = function (bookId, chapter) {
    let book = books[bookId];

    if (book === undefined || chapter < 0 || chapter > book.numChapters) {
        return false;
    }

    if (chapter === 0 && books.numChapters > 0) {
        return false;
    }

    return true;
};

const booksGrid = function (volume) {
    return Html.div({
        classKey: CLASS_BOOKS,
        content: booksGridContent(volume)
    });
};

const booksGridContent = function (volume) {
    let gridContent = "";

    volume.books.forEach(function (book) {
        gridContent += Html.link({
            classKey: CLASS_BUTTON,
            id: book.id,
            href: `#${volume.id}:${book.id}`,
            content: book.gridName
        });
    });

    return gridContent;
};

const chaptersGrid = function (book) {
    return Html.div({
        classKey: CLASS_VOLUME,
        content: Html.element(TAG_HEADERS, book.fullName)
    }) + Html.div({
        classKey: CLASS_BOOKS,
        content: chaptersGridContent(book)
    });
};

const chaptersGridContent = function (book) {
    let gridContent = "";
    let chapter = 1;

    while (chapter <= book.numChapters) {
        gridContent += Html.link({
            classKey: `${CLASS_BUTTON}${CLASS_CHAPTER}`,
            id: chapter,
            href: `#0:${book.id}:${chapter}`,
            content: chapter
        });
        chapter += 1;
    }

    return gridContent;
};

const navigateBook = function (bookId) {
    let book = books[bookId];

    if (book.numChapters <= 1) {
        navigateChapter(bookId, book.numChapters);
    } else {
        document.getElementById(DIV_SCRIPTURES).innerHTML = Html.div({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: chaptersGrid(book)
        });
        injectBreadcrumbs(Api.volumeForId(book.parentBookId), book);
        MapHelper.setupMarkers();
    }
};

const navigateHome = function (volumeId) {
    document.getElementById(DIV_SCRIPTURES).innerHTML = Html.div({
        id: DIV_SCRIPTURES_NAVIGATOR,
        content: volumesGridContent(volumeId)
    });

    injectBreadcrumbs(Api.volumeForId(volumeId));
    MapHelper.setupMarkers();
};

const onHashChanged = function () {
    let ids = [];

    if (location.hash !== "" && location.hash.length > 1) {
        ids = location.hash.slice(1).split(":");
    }

    if (ids.length <= 0) {
        navigateHome();
    } else if (ids.length === 1) {
        let volumeId = Number(ids[0]);

        if (volumeId < volumes[0].id || volumeId > volumes.slice(-1)[0].id) {
            navigateHome();
        } else {
            navigateHome(volumeId);
        }
    } else if (ids.length >= 2) {
        let bookId = Number(ids[1]);

        if (bookId === undefined) {
            navigateHome();
        } else {
            let chapter = Number(ids[2]);

            if (ids.length === 2) {
                navigateBook(bookId);
            } else {
                if (bookChapterValid(bookId, chapter)) {
                    navigateChapter(bookId, chapter);
                } else {
                    navigateHome();
                }
            }
        }
    }
};

const volumesGridContent = function (volumeId) {
    let gridContent = "";

    volumes.forEach(function (volume) {
        if (volumeId === undefined || volumeId === volume.id) {
            gridContent += Html.div({
                classKey: CLASS_VOLUME,
                content: Html.anchor(volume) + Html.element(TAG_HEADERS, volume.fullName)
            });

            gridContent += booksGrid(volume);
        }
    });

    return gridContent + BOTTOM_PADDING;
};

/**----------------------------------------------------
* PUBLIC API
*/
export default Object.freeze(onHashChanged);