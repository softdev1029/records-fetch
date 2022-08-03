import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...

// Disposition values
const DISP_OPEN = "open";
const DISP_CLOSED = "closed";

// Color values
const COL_RED = "red";
const COL_BULE = "blue";
const COL_YELLOW = "yellow";

// Primary colors
const PRI_COLORS = [COL_RED, COL_BULE, COL_YELLOW];

// Page item count
const PAGE_ITEMS = 10;

/**
 * Checks if the color is a primary one or not
 * 
 * @param {string} color 
 * @returns true if the color is a primary one, otherwise false
 */
const isPrimaryColor = (color) => {
    return PRI_COLORS.some(c => c === color);
}

/**
 * The /records endpoint accepts the following options, sent as query
 * string parameters on the request URL
 * 
 * @param {number} page 
 * @param {Array} colors 
 * @returns 
 */
const makeURI = (page, colors) => {
    return URI(window.path).search({

        // limit: The number of items to be returned
        // to check the last page, one more item is required
        limit: PAGE_ITEMS + 1,

        // offset: The index of the first item to be returned
        offset: page > 0 ? (page - 1) * PAGE_ITEMS : 0,

        // color[]: Which color to be included in the result set. May be
        // included multiple times, once for each color. If omitted, all colors
        // will be returned.
        color: colors.length === 1 ? colors.concat([""]) : colors,
    });
}

/**
 * 
 * @param {Object} options
 * 
 * The retrieve function accepts an options object and should
 * support the following keys:
 *  
 *      page - Specifies which page to retrieve from the /records
 *             endpoint. If omitted, fetch page 1.
 * 
 *      colors - An array of colors to retrieve from the /records endpoint.
 *               If omitted, fetch all colors.
 * 
 * As an example, to fetch the 2nd page of red and brown items from
 * the API, retrieve might be called like this:
 * retrieve({ page: 2, colors: ["red", "brown"] });
 * 
 * @returns a promise that resolves with the transformed object.
 */
const retrieve = (options = {}) => {
    const {page = 1, colors = []} = options;
    return fetch(makeURI(page, colors))
    .then(res => {
        // You can assume standard HTTP status codes on the response. If a
        // request is unsuccessful, output a simple error message via
        // console.log() and recover.
        if (res.status !== 200) {
            console.log('status', res.status);
            console.log('statusText', res.statusText);
            return [];
        } else {
            return res.json();
        }
    })
    .then(res => {

        // By 'limit' query parameter, 11 should be returned if it is not the last page
        const isLastPage = res.length <= PAGE_ITEMS;

        // Process pages of 10 items at a time.
        // Note that the /records endpoint may return more than 10 items per request.
        res = res.slice(0, PAGE_ITEMS);

        // ids: An array containing the ids of all items returned from the request.
        const ids = res.map(e => e.id);

        // open: An array containing all of the items returned from the request
        // that have a disposition value of "open".
        const open = res.filter(e => e.disposition === DISP_OPEN)
            .map(e => {
                return {
                    ...e,
                    // Add a fourth key to each item called isPrimary indicating whether or not the item
                    // contains a primary color (red, blue, or yellow).
                    isPrimary: isPrimaryColor(e.color)
                }
            });
        
        // closedPrimaryCount: The total number of items returned from the
        // request that have a disposition value of "closed" and contain
        // a primary color.
        const closedPrimaryCount = res.filter(e => e.disposition === DISP_CLOSED && isPrimaryColor(e.color)).length;

        return {
            previousPage: page === 1 ? null : page - 1,
            nextPage: isLastPage ? null : page + 1,
            ids,
            open,
            closedPrimaryCount
        };
    })
    .catch(error => {
        console.log('err', error);
    });
}

export default retrieve;
