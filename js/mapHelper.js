/**
 * Name: Katie Bankhead
 * Date: Winter 2021
 * Description: Module for interacting with Google Maps API
 */
/*jslint
    browser, long
*/
/*global
    console, map, google, MarkerWithLabel
*/
/*property
    Animation, DROP, LatLng, LatLngBounds, Marker, abs, align, animation, exec,
    extend, fitBounds, fontColor, fontSize, forEach, freeze, getAttribute,
    getCenter, getPosition, getTitle, includes, lat, length, lng, log, map,
    maps, panTo, position, push, querySelectorAll, round, setMap, setTitle,
    setZoom, setupMarkers, showLocation, strokeColor, text, title
*/

/**----------------------------------------------------
 * CONSTANTS
 */
const INDEX_FLAG = 11;
const INDEX_LATITUDE = 3;
const INDEX_LONGITUDE = 4;
const INDEX_PLACENAME = 2;
const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
const MAX_ZOOM_LEVEL = 18;
const MIN_ZOOM_LEVEL = 6;
const ZOOM_RATIO = 450;

/**----------------------------------------------------
* PRIVATE VARIABLES
*/
let gmLabels = [];
let gmMarkers = [];
let initializedMapLabel = false;

/**----------------------------------------------------
* PRIVATE METHODS
*/
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
};

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

const zoomMapToFitMarkers = function (matches) {
    if(gmMarkers.length > 0){
        if(gmMarkers.length === 1 && matches) {
            let zoomLevel = Math.round(Number(matches[9]) / ZOOM_RATIO);

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
};

/**----------------------------------------------------
* PUBLIC API
*/

const MapHelper = {
    setupMarkers,
    showLocation
};

export default Object.freeze(MapHelper);