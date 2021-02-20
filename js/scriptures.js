/**
 * Name: Katie Bankhead
 * Date: Winter 2021
 * Description: Front-end JS code for The Scriptures, Mapped.
 */
/*jslint
    browser, long
*/
/*global
    console, map
*/
/*property
    books, classKey, content, forEach, fullName, getElementById, gridName, hash,
    href, id, init, innerHTML, length, log, maxBookId, minBookId, numChapters,
    onHashChanged, onerror, onload, open, parse, push, response, send, slice,
    split, status, Animation, DROP, Marker, animation, label, lat, lng, map, maps, position,
    title
*/

"use strict";

/**----------------------------------------------------
 * CONSTANTS
 */

 // these variables are not global anymore, they're now hidden by the module
const BOTTOM_PADDING = "<br /><br />";
const CLASS_BOOKS = "books";
const CLASS_BUTTON = "btn";
const CLASS_CHAPTER = "chapter";
const CLASS_VOLUME = "volume";
const CLASS_ICON = "material-icons";
const DIV_BREADCRUMBS = "crumbs";
const DIV_NAV_HEADING = "navheading";
const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
const DIV_SCRIPTURES = "scriptures";
const ICON_NEXT = "skip_next";
const ICON_PREVIOUS = "skip_previous";
const INDEX_PLACENAME = 2;
const INDEX_LATITUDE = 3;
const INDEX_LONGITUDE = 4;
const INDEX_FLAG = 11;
const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
const TAG_HEADERS = "h5";
const TAG_LIST_ITEM = "li";
const TAG_SPAN = "span";
const TAG_UNORDERED_LIST = "ul";
const TEXT_TOP_LEVEL = "The Scriptures";
const URL_BASE = "https://scriptures.byu.edu/";
const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;

/**----------------------------------------------------
* PRIVATE VARIABLES
*/
let books;
let gmMarkers = [];
let requestedBookId;
let requestedChapter;
let requestedNextPrevious;
let volumes;

/**----------------------------------------------------
* PRIVATE METHODS
*/
const addMarker = function (placename, latitude, longitude) {
    //TODO: check to see if we already have this lat/long in the gmMarkers array
    let pos = { lat: Number(latitude), lng: Number(longitude) };
    let marker = new google.maps.Marker({
        position: pos,
        map,
        title: placename,
        label: placename,
        animation: google.maps.Animation.DROP,
    });

    gmMarkers.push(marker);
};

const ajax = function (url, successCallback, failureCallback, skipJsonParse) {
    fetch(url)
    .then(function (response) {
        if (response.ok) {
            if (skipJsonParse) {
                return response.text();
            } else {
                return response.json();
            }
        }

        throw new Error("Network response was not okay.");
    })
    .then(function (data) {
        successCallback(data);
    })
    .catch(function (error) {
        failureCallback(error);
    });
};

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
    return htmlDiv({
        classKey: CLASS_BOOKS,
        content: booksGridContent(volume)
    });
};

const booksGridContent = function (volume) {
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

const cacheBooks = function (callback) {
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

const chaptersGrid = function (book) {
    return htmlDiv({
        classKey: CLASS_VOLUME,
        content: htmlElement(TAG_HEADERS, book.fullName)
    }) + htmlDiv({
        classKey: CLASS_BOOKS,
        content: chaptersGridContent(book)
    });
};

const chaptersGridContent = function (book) {
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

const clearMarkers = function () {
    gmMarkers.forEach(function (marker) {
        marker.setMap(null);
    });

    gmMarkers = [];
};

const encodedScripturesUrlParameters = function (bookId, chapter, verses, isJst) {
    if (bookId !== undefined && chapter !== undefined) {
        let options = "";

        if (verses !== undefined) {
            options += verses;
        }

        if (isJst !== undefined) {
            options += "&jst=JST";
        }
        
        return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
    }
};

const getScripturesCallback = function (chapterHtml) {
    let book = books[requestedBookId];

    document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;

    // next/prev navigation
    document.querySelectorAll(`.${DIV_NAV_HEADING}`).forEach(function (element) {
        element.innerHTML += `<div class="nextprev">${requestedNextPrevious}</div>`;
    });

    // update breadcrumbs
    if(book !== undefined ){
        injectBreadcrumbs(volumeForId(book.parentBookId), book, requestedChapter);
    }
    else {
        injectBreadcrumbs();
    }

    setupMarkers();
};

const getScripturesFailure = function () {
    document.getElementById(DIV_SCRIPTURES).innerHTML = "Unable to retrieve chapter content from server.";
    injectBreadcrumbs();
};

const htmlAnchor = function (volume) {
    return `<a name="v${volume.id}" />`;
};

const htmlDiv = function (parameters) {
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

const htmlElement = function (tagName, content, classValue) {
    let classString = "";

    if(classValue !== undefined) {
        classString = ` class="${classValue}"`;
    }

    return `<${tagName}${classString}>${content}</${tagName}>`;
};

const htmlListItem = function (content) {
    return htmlElement(TAG_LIST_ITEM, content);
}

const htmlListItemLink = function(content, href = ""){
    return htmlListItem(htmlLink({content, href: `#${href}`}));
}

const htmlLink = function (parameters) {
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

const init = function (callback) {
    let booksLoaded = false;
    let volumesLoaded = false;

    ajax(URL_BOOKS, function (data) {
        books = data;
        booksLoaded = true;

        if (volumesLoaded) {
            cacheBooks(callback);
        }
    });
    ajax(URL_VOLUMES, function (data) {
        volumes = data;
        volumesLoaded = true;

        if (booksLoaded) {
            cacheBooks(callback);
        }
    });
};

const injectBreadcrumbs = function(volume, book, chapter) {
    let crumbs = "";

    if (volume === undefined) {
        crumbs = htmlListItem(TEXT_TOP_LEVEL)
    } else {
        crumbs = htmlListItemLink(TEXT_TOP_LEVEL)

        if (book === undefined){
            crumbs += htmlListItem(volume.fullName)
        } else {
            crumbs += htmlListItemLink(volume.fullName, volume.id);

            if (chapter === undefined || chapter <= 0){
                crumbs += htmlListItem(book.tocName)
            } else {
                crumbs += htmlListItemLink(book.tocName, `#${volume.id}:${book.id}`);
                crumbs += htmlListItem(chapter)
            }
        }
    }

    document.getElementById(DIV_BREADCRUMBS).innerHTML = htmlElement(TAG_UNORDERED_LIST, crumbs);
}

// TODO: markerIndex function
// TODO: mergePlacename function

const navigateBook = function (bookId) {
    let book = books[bookId];

    if (book.numChapters <= 1) {
        navigateChapter(bookId, book.numChapters);
    } else {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: chaptersGrid(book)
        })
        injectBreadcrumbs(volumeForId(book.parentBookId), book)
    }
};

const navigateChapter = function (bookId, chapter) {
    requestedBookId = bookId;
    requestedChapter = chapter;

    let prev = previousChapter(bookId, chapter);
    let next = nextChapter(bookId, chapter);

    if(prev === undefined) {
        requestedNextPrevious = "";
    }
    else {
        requestedNextPrevious = nextPreviousMarkup(prev, ICON_PREVIOUS)
    }

    if(next !== undefined) {
        requestedNextPrevious += nextPreviousMarkup(next, ICON_NEXT)
    }


    ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true);
};

const navigateHome = function (volumeId) {
    document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
        id: DIV_SCRIPTURES_NAVIGATOR,
        content: volumesGridContent(volumeId)
    });

    injectBreadcrumbs(volumeForId(volumeId));
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

const nextPreviousMarkup = function(nextPrev, icon) {
    return htmlLink({
        content: htmlElement(TAG_SPAN, icon, CLASS_ICON),
        href: `#0:${nextPrev[0]}:${nextPrev[1]}`,
        title: nextPrev[2]
    });
}

const onHashChanged = function () {
    let ids = [];

    if (location.hash !== "" && location.hash.length > 1) {
        ids = location.hash.slice(1).split(":");
    }

    if (ids.length <= 0) {
        navigateHome();
    }
    else if (ids.length === 1) {
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

const previousChapter = function (bookId, chapter) {
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

const setupMarkers = function () {
    if (gmMarkers.length > 0) {
        clearMarkers();
    }

    document.querySelectorAll("a[onclick^=\"showLocation(\"]").forEach(function (element) {
        let matches = LAT_LON_PARSER.exec(element.getAttribute("onclick"));

        if (matches) {
            let placename = matches[INDEX_PLACENAME];
            let latitude = matches[INDEX_LATITUDE];
            let longitude = matches[INDEX_LONGITUDE];
            let flag = matches[INDEX_FLAG];

            if (flag !== "") {
                placename = `${placename} ${flag}`;
            }

            addMarker(placename, latitude, longitude);
        }
    });

    // TODO: started working on configuring zoom/view after all markers have been added
    // let bounds = new google.maps.LatLngBounds();
    // console.log('bounds', bounds)
    // for (let i = 0; i < gmMarkers.length; i++) {
    //     bounds.extend(gmMarkers[i]);
    // }

    // map.fitBounds(bounds);

};

const showLocation = function (geotagId, placename, latitude, longitude, viewLatitude, viewLongitude,
    viewTilt, viewRoll, viewAltitude, viewHeading) {
    console.log(viewAltitude);
};

const titleForBookChapter = function (book, chapter) {
    if (book !== undefined) {
        if (chapter > 0) {
            return `${book.tocName} ${chapter}`;
        }

        return book.tocName;
    }
};

const volumeForId = function(volumeId) {
    if (volumeId !== undefined && volumeId > 0 && volumeId < volumes.length){
        return volumes[volumeId - 1];
    }
};

const volumesGridContent = function (volumeId) {
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

//module level variable
const Scriptures = {
    init,
    onHashChanged,
    showLocation
};

// export the frozen object associated with Scriptures (not scriptures itself)
export default Object.freeze(Scriptures);
