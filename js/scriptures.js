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
    const DIV_BREADCRUMBS = "crumbs";
    const DIV_NAV_HEADING = "navheading";
    const DIV_SCRIPTURES_NAVIGATOR = "scripnav";
    const DIV_SCRIPTURES = "scriptures";
    const INDEX_PLACENAME = 2;
    const INDEX_LATITUDE = 3;
    const INDEX_LONGITUDE = 4;
    const INDEX_FLAG = 11;
    const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;
    const TAG_HEADERS = "h5";
    const TAG_LIST_ITEM = "li";
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
    let volumes;

    /**----------------------------------------------------
    * PRIVATE METHOD DECLARATIONS
    */
    let addMarker;
    let ajax;
    let bookChapterValid;
    let booksGrid;
    let booksGridContent;
    let cacheBooks;
    let chaptersGrid;
    let chaptersGridContent;
    let clearMarkers;
    let encodedScripturesUrlParameters;
    let getScripturesCallback;
    let getScripturesFailure;
    let htmlAnchor;
    let htmlDiv;
    let htmlElement;
    let htmlHashLink;
    let htmlListItem;
    let htmlListItemLink;
    let htmlLink;
    let init;
    let injectBreadcrumbs;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let nextChapter;
    let onHashChanged;
    let previousChapter;
    let setupMarkers;
    let showLocation;
    let titleForBookChapter;
    let volumeForId;
    let volumesGridContent;

    /**----------------------------------------------------
    * PRIVATE METHODS
    */
    addMarker = function (placename, latitude, longitude) {
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

        request.onerror = console.log("request.onerror");
        request.send();
    };

    bookChapterValid = function (bookId, chapter) {
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

    clearMarkers = function () {
        gmMarkers.forEach(function (marker) {
            marker.setMap(null);
        });

        gmMarkers = [];
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
        let book = books[requestedBookId];

        document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;

        // next/prev navigation
        // get next chapter
        // get prev chapter

        const nextChapterHref = nextChapter(book, requestedChapter);

        for (const div of document.getElementsByClassName(DIV_NAV_HEADING)){
            div.innerHTML += '<div class="nextprev"><a href="#0:201:0">Next</a><a href="#3:210">Prev</a></div>';
            
        }

        // update breadcrumbs
        if(book !== undefined ){
            injectBreadcrumbs(volumeForId(book.parentBookId), book, requestedChapter);
        }
        else {
            injectBreadcrumbs();
        }

        setupMarkers();
    };

    getScripturesFailure = function () {
        document.getElementById(DIV_SCRIPTURES).innerHTML = "Unable to retrieve chapter content from server.";
        injectBreadcrumbs();
    };

    htmlAnchor = function (volume) {
        return `<a name="v${volume.id}" />`;
    };

    htmlDiv = function (parameters) {
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

    htmlElement = function (tagName, content) {
        return `<${tagName}>${content}</${tagName}>`;
    };

    //TODO: use to create next/back buttons
    htmlHashLink = function (hashArguments, content) {
        return `<a href="javascript:void(0)" onclick="changeHash(${hashArguments})">${content}</a>`;
    };

    htmlListItem = function (content) {
        return htmlElement(TAG_LIST_ITEM, content);
    }

    htmlListItemLink = function(content, href = ""){
        return htmlListItem(htmlLink({content, href: `#${href}`}));
    }

    htmlLink = function (parameters) {
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

        if (parameters.id !== undefined) {
            idString = ` id="${parameters.id}"`;
        }

        return `<a${idString}${classString}${hrefString}>${contentString}</a>`;
    };


    // Replace calls to the XMLHttpRequest API in your Project 1 solution with calls to the 
    // fetch API we explored on Day 10.
    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax("https://scriptures.byu.edu/mapscrip/model/books.php",
            (data) => {
                books = data;
                booksLoaded = true;

                if (volumesLoaded) {
                    cacheBooks(callback);
                }
            }
        );
        ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php",
            (data) => {
                volumes = data;
                volumesLoaded = true;

                if (booksLoaded) {
                    cacheBooks(callback);
                }
            }
        );
    };

    injectBreadcrumbs = function(volume, book, chapter) {
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

    navigateBook = function (bookId) {
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

    navigateChapter = function (bookId, chapter) {
        requestedBookId = bookId;
        requestedChapter = chapter;

        ajax(encodedScripturesUrlParameters(bookId, chapter), getScripturesCallback, getScripturesFailure, true);
    };

    navigateHome = function (volumeId) {
        document.getElementById(DIV_SCRIPTURES).innerHTML = htmlDiv({
            id: DIV_SCRIPTURES_NAVIGATOR,
            content: volumesGridContent(volumeId)
        });

        injectBreadcrumbs(volumeForId(volumeId));
    };

    nextChapter = function (bookId, chapter) {
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

    onHashChanged = function () {
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

    previousChapter = function (bookId, chapter) {
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

    setupMarkers = function () {
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

    showLocation = function (geotagId, placename, latitude, longitude, viewLatitude, viewLongitude,
        viewTilt, viewRoll, viewAltitude, viewHeading) {
        console.log(viewAltitude);
    };

    titleForBookChapter = function (book, chapter) {
        if (book !== undefined) {
            if (chapter > 0) {
                return `${book.tocName} ${chapter}`;
            }

            return book.tocName;
        }
    };

    volumeForId = function(volumeId) {
        if (volumeId !== undefined && volumeId > 0 && volumeId < volumes.length){
            return volumes[volumeId - 1];
        }
    };

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
        onHashChanged,
        showLocation,
    };
}());