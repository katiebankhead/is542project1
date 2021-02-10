/**
 * Name: Katie Bankhead
 * Date: Winter 2021
 * Description: Front-end JS code for The Scriptures, Mapped.
 */
/*jslint
    browser, long
*/
/*property
    books, classKey, content, forEach, fullName, getElementById, gridName, hash,
    href, id, init, innerHTML, length, log, maxBookId, minBookId, numChapters,
    onHashChanged, onerror, onload, open, parse, push, response, send, slice,
    split, status
*/

const Scriptures = (function () {
    "use strict";

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
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const TAG_HEADERS = "h5";
    const URL_BASE = "https://scriptures.byu.edu/";
    const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
    const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
    const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;

    /**----------------------------------------------------
    * PRIVATE VARIABLES
    */
    let books;
    let volumes;

    /**----------------------------------------------------
    * PRIVATE METHOD DECLARATIONS
    */
    let ajax;
    let bookChapterValid;
    let booksGrid;
    let booksGridContent;
    let cacheBooks;
    let chaptersGrid;
    let chaptersGridContent;
    let encodedScripturesUrlParameters;
    let getScripturesCallback;
    let getScripturesFailure;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlHashLink;
    let htmlLink;
    let init;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let nextChapter;
    let onHashChanged;
    let previousChapter
    let titleForBookChapter;
    let volumesGridContent;

    /**----------------------------------------------------
    * PRIVATE METHODS
    */
    ajax = function (url, successCallback, failureCallback, skipJsonParse) {
        let request = new XMLHttpRequest();

        request.open(REQUEST_GET, url, true);

        request.onload = function () {
            if (request.status >= REQUEST_STATUS_OK && request.status < REQUEST_STATUS_ERROR) {
                let data = (
                    skipJsonParse 
                    ? request.response 
                    : JSON.parse(request.response)
                );

                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                if (typeof failureCallback === "function") {
                    failureCallback(request);
                }
            }
        };

        // request.onerror = failureCallback();
        request.onerror = console.log("request.onerror");
        request.send();
    };

    bookChapterValid = function(bookId, chapter) {
        let book = books[bookId];

        if (book === undefined || chapter < 0 || chapter > book.numChapters) {
            return false;
        }

        if (chapter === 0 && books.numChapters > 0) {
            return false;
        }

        return true;
    };

    booksGrid = function (volume) {
        return htmlDiv({
            classKey: CLASS_BOOKS,
            content: booksGridContent(volume)
        });
    };

    booksGridContent = function (volume) {
        let gridContent = "";

        volume.books.forEach(function (book) {
            gridContent += htmlLink({
                classKey: CLASS_BUTTON,
                id: book.id,
                href: `#${volume.id}:${book.id}`,
                content: book.gridName
            });
        });

        return gridContent;
    };

    cacheBooks = function (callback) {
        volumes.forEach((volume) => {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }

            volume.books = volumeBooks;
        });

        if (typeof callback === "function") {
            callback();
        }
    };

    chaptersGrid = function (book) {
        return htmlDiv({
            classKey: CLASS_VOLUME,
            content: htmlElement(TAG_HEADERS, book.fullName)
        }) + htmlDiv({
            classKey: CLASS_BOOKS,
            content: chaptersGridContent(book)
        });
    };

    chaptersGridContent = function (book) {
        let gridContent = "";
        let chapter = 1;

        while (chapter <= book.numChapters) {
            gridContent += htmlLink({
                classKey: `${CLASS_BUTTON}${CLASS_CHAPTER}`,
                id: chapter,
                href: `#0:${book.id}:${chapter}`,
                content: chapter
            })
            chapter += 1;
        }

        return gridContent;
    };

    encodedScripturesUrlParameters = function (bookId, chapter, verses, isJst) {
        if (bookId !== undefined && chapter !== undefined) {
            let options = "";

            if (verses !== undefined) {
                options += verses;
            }

            if (isJst !== undefined) {
                options += "&jst=JST";
            }

            return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`
        }
    };

    getScripturesCallback = function (chapterHtml) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;

        //TODO: setupMarkers()
    };

    getScripturesFailure = function () {
        document.getElementById(DIV_SCRIPTURES).innerHTML = "Unable to retrieve chapter content from server.";
    };

    htmlAnchor = function(volume) {
        return `<a name="v${volume.id}" />`;
    };

    htmlDiv = function(parameters) {
        let classString = "";
        let contentString = "";
        let idString = "";

        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}" `;
        }

        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }

        if(parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }

        return `<div${idString}${classString}>${contentString}</div>`;
    };

    htmlElement = function(tagName, content) {
        return `<${tagName}>${content}</${tagName}>`;
    };

    htmlHashLink = function(hashArguments, content) {
        return `<a href="javascript:void(0)" onclick="changeHash(${hashArguments})">${content}</a>`;
    };

    htmlLink = function(parameters) {
        let classString = "";
        let contentString = "";
        let hrefString = "";
        let idString = "";

        if (parameters.classKey !== undefined) {
            classString = ` class="${parameters.classKey}" `;
        }

        if (parameters.content !== undefined) {
            contentString = parameters.content;
        }

        if (parameters.href !== undefined) {
            hrefString = ` href="${parameters.href}"`;
        }

        if(parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }

        return `<a${idString}${classString}${hrefString}>${contentString}</a>`;
    };

    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax("https://scriptures.byu.edu/mapscrip/model/books.php",
            (data) => {
                books = data;
                booksLoaded = true;

                if(volumesLoaded) {
                    cacheBooks(callback);
                }
            }
        );
        ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php",
            (data) => {
                volumes = data;
                volumesLoaded = true;

                if(booksLoaded) {
                    cacheBooks(callback);
                }
            }
        );
    };

    navigateBook = function(bookId) {
        let book = books[bookId];

        if (book.numChapters <= 1) {
            navigateChapter(bookId, book.numChapters);
        } else {
            document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
                id: DIV_SCRIPTURES_NAVIGATOR,
                content: chaptersGrid(book)
            })
        }
    };

    navigateChapter = function(bookId, chapter) {
        ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true);
    };

    navigateHome = function(volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: volumesGridContent(volumeId)
        });
    };

    nextChapter = function(bookId, chapter) {
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

    onHashChanged = function() {
        let ids = [];

        if (location.hash !== "" && location.hash.length > 1) {
            ids = location.hash.slice(1).split(":");
        }

        if (ids.length <= 0) {
            navigateHome();
        }
        else if (ids.length === 1) {
            // display volume
            let volumeId = Number(ids[0]);

            if (volumeId < volumes[0].id || volumeId > volumes.slice(-1)[0].id) {
                navigateHome();
            }
            else {
                navigateHome(volumeId);
            }
        } else if (ids.length >= 2) {
            let bookId = Number(ids[1]);

            if (bookId === undefined) {
                navigateHome();
            }
            else {
                let chapter = Number(ids[2]);

                if (ids.length === 2) {
                    navigateBook(bookId);
                }
                else {
                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    }
                    else {
                        navigateHome();
                    }
                }
            }
        }
    };

    previousChapter = function(bookId, chapter) {
        let book = books[bookId];

        if (book !== undefined) {
            if (chapter > 1) {
                return [
                    bookId,
                    chapter - 1,
                    titleForBookChapter(book, chapter - 1)
                ]
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

    titleForBookChapter = function (book, chapter) {
        if(book !== undefined) {
            if (chapter > 0) {
                return `${book.tocName} ${chapter}`;
            }

            return book.tocName;
        }
    }

    volumesGridContent = function (volumeId) {
        let gridContent = "";

        volumes.forEach(function (volume) {
            if (volumeId === undefined || volumeId === volume.id) {
                gridContent += htmlDiv({
                    classKey: CLASS_VOLUME,
                    content: htmlAnchor(volume) + htmlElement(TAG_HEADERS, volume.fullName)
                });

                gridContent += booksGrid(volume);
            }
        });
        
        return gridContent + BOTTOM_PADDING;
    };

    /**----------------------------------------------------
    * PUBLIC API
    */
    return {
        init,
        onHashChanged
    };
}());