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
    Animation, DROP, LatLng, Marker, abs, align, animation, books, catch,
    classKey, content, fontColor, fontSize, forEach, fullName, getElementById,
    getPosition, getTitle, gridName, hash, href, id, includes, innerHTML, json,
    lat, length, lng, map, maps, maxBookId, minBookId, numChapters, ok,
    parentBookId, position, push, querySelectorAll, setMap, setTitle, slice,
    split, strokeColor, text, then, title, tocName
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
const INDEX_FLAG = 11;
const INDEX_LATITUDE = 3;
const INDEX_LONGITUDE = 4;
const INDEX_PLACENAME = 2;
const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
const MAX_ZOOM_LEVEL = 18;
const MIN_ZOOM_LEVEL = 6;
const TAG_HEADERS = "h5";
const TAG_LIST_ITEM = "li";
const TAG_SPAN = "span";
const TAG_UNORDERED_LIST = "ul";
const TEXT_TOP_LEVEL = "The Scriptures";
const URL_BASE = "https://scriptures.byu.edu/";
const URL_BOOKS = `${URL_BASE}mapscrip/model/books.php`;
const URL_SCRIPTURES = `${URL_BASE}mapscrip/mapgetscrip.php`;
const URL_VOLUMES = `${URL_BASE}mapscrip/model/volumes.php`;
const ZOOM_RATIO = 450;

/**----------------------------------------------------
* PRIVATE VARIABLES
*/
let books;
let gmLabels = [];
let gmMarkers = [];
let initializedMapLabel = false;
let requestedBookId;
let requestedChapter;
let requestedNextPrevious;
let volumes;

/**----------------------------------------------------
* PRIVATE METHODS
*/

// current error is coming somewhere from this logic
const addMarker = function (placename, latitude, longitude) {
    let index = markerIndex(latitude, longitude);

    if (index >= 0){
        // if lat/lng is already in gmMarkers, merge the placename
        mergePlacename(placename, index);
    } else {
        // create map marker
        let marker = new google.maps.Marker({
            position: { lat: Number(latitude), lng: Number(longitude) },
            map,
            title: placename,
            animation: google.maps.Animation.DROP
        });

        gmMarkers.push(marker);

        // // initialize labels
        if (!initializedMapLabel) {
            const initialize = MapLabelInit;

            initialize();
            initializedMapLabel = true;
        }

        // create map marker label
        let mapLabel = new MapLabel({
            text: marker.getTitle(),
            position: new google.maps.LatLng(Number(latitude), Number(longitude)),
            map,
            fontSize: 16,
            fontColor: "#201000",
            strokeColor: "#fff8f0",
            align: "left"
        });

        gmLabels.push(mapLabel);
    }
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
    disconnectMapFromMarkers(gmMarkers);
    disconnectMapFromMarkers(gmLabels);

    gmMarkers = [];
    gmLabels = [];
};

const disconnectMapFromMarkers = function (markers) {
    markers.forEach(function (marker) {
        marker.setMap(null);
    });
}

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

const htmlListItem = function (content) {
    return htmlElement(TAG_LIST_ITEM, content);
}

const htmlListItemLink = function(content, href = ""){
    return htmlListItem(htmlLink({content, href: `#${href}`}));
}

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

const markerIndex = function(latitude, longitude) {
    let i = gmMarkers.length - 1; // get last marker in array

    while (i >= 0) { // while gmMarkers contains at least one marker
        let marker = gmMarkers[i];

        // safe way to compare IEEE floating point numbers (weird JS quirks)
        const latitudeDelta = Math.abs(marker.getPosition().lat() - latitude);
        const longitudeDelta = Math.abs(marker.getPosition().lng() - longitude);

        // if marker is already in array, return index
        if (latitudeDelta < 0.00000001 && longitudeDelta < 0.00000001){
            return i;
        }

        i -= 1;
    }

    return -1;
};

// const mergePlacename = function (placename, index) {
//     let marker = gmMarkers[index];
//     let label = gmLabels[index];
//     let title = marker.getTitle();

//     if (!title.includes(placename)) {
//         title += ", " + placename;
//         marker.setTitle();
//         label.text = title;
//     }
// };

const mergePlacename = function (placename, index) {
    let marker = gmMarkers[index];
    let label = gmLabels[index];
    let title = marker.getTitle();

    if (!title.includes(placename)) {
        title += ", " + placename;
        marker.setTitle(title);
        label.text = title;
    }
};

const navigateBook = function (bookId) {
    let book = books[bookId];

    if (book.numChapters <= 1) {
        navigateChapter(bookId, book.numChapters);
    } else {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: chaptersGrid(book)
        })
        injectBreadcrumbs(volumeForId(book.parentBookId), book);
        setupMarkers();
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
    setupMarkers();
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
    } else if (ids.length === 1) {
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

    let matches;

    document.querySelectorAll("a[onclick^=\"showLocation(\"]").forEach(function (element) {
        matches = LAT_LON_PARSER.exec(element.getAttribute("onclick"));

        if (matches) {
            let placename = matches[INDEX_PLACENAME];
            let latitude = parseFloat(matches[INDEX_LATITUDE]);
            let longitude = parseFloat(matches[INDEX_LONGITUDE]);
            let flag = matches[INDEX_FLAG];

            if (flag !== "") {
                placename = `${placename} ${flag}`;
            }

            addMarker(placename, latitude, longitude);
        }
    });
    zoomMapToFitMarkers(matches);
};

const showLocation = function (id, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewAltitude, viewHeading) {
    console.log(id, placename, latitude, longitude, viewLatitude, viewLongitude, viewTilt, viewRoll, viewHeading);
    map.panTo({lat: latitude, lng: longitude});
    map.setZoom(Math.round(viewAltitude / ZOOM_RATIO));
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

const zoomMapToFitMarkers = function (matches) {
    if(gmMarkers.length > 0){
        if(gmMarkers.length === 1 && matches) {
            let zoomLevel = Math.round(Number(matches[9]) / ZOOM_RATIO)

            if (zoomLevel < MIN_ZOOM_LEVEL) {
                zoomLevel = MIN_ZOOM_LEVEL;
            } else if (zoomLevel > MAX_ZOOM_LEVEL) {
                zoomLevel = MAX_ZOOM_LEVEL;
            }

            map.setZoom(zoomLevel);
            map.panTo(gmMarkers[0].position);
        } else {
            let bounds = new google.maps.LatLngBounds();

            gmMarkers.forEach(function (marker) {
                bounds.extend(marker.position);
            });

            map.panTo(bounds.getCenter());
            map.fitBounds(bounds);
        }
    }
}

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
