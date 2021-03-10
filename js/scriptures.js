/**
 * Name: Katie Bankhead
 * Date: Winter 2021
 * Description: Front-end JS code for The Scriptures, Mapped.
 */
/*jslint
    browser, long
*/

/**----------------------------------------------------
 * IMPORTS
 */
import Api from "./mapScripApi.js";
import MapHelper from "./mapHelper.js";
import onHashChanged from "./navigation.js";

/**----------------------------------------------------
* PUBLIC API
*/
const Scriptures = {
    init: Api.init,
    onHashChanged,
    showLocation: MapHelper.showLocation
};

export default Object.freeze(Scriptures);
