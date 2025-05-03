const axios = require('axios');

// Constants
const TRAC_API_BASE = "https://graph.tractive.com/4";
const TRACTIVE_CLIENT = "6536c228870a3c8857d452e8";  // Added client ID
let ACCESS_TOKEN = null;
let ACCOUNT_DETAILS = null;

/**
 * Authenticate and set ACCESS_TOKEN globally.
 */
async function connect(email, password) {
    try {
        console.log('Attempting to connect to Tractive API...');
        const url = `${TRAC_API_BASE}/auth/token?grant_type=tractive&platform_email=${encodeURIComponent(email)}&platform_token=${encodeURIComponent(password)}`;

        const res = await axios.post(url, null, {
            headers: {
                'X-Tractive-Client': TRACTIVE_CLIENT,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        ACCESS_TOKEN = res.data.access_token;
        ACCOUNT_DETAILS = {
            uid: res.data.user_id,
            token: ACCESS_TOKEN
        };

        if (!ACCESS_TOKEN) throw new Error('Authentication failed: No access token');
        console.log('Successfully authenticated with Tractive API');
        return true;

    } catch (error) {
        // Reset authentication state on failure
        ACCESS_TOKEN = null;
        ACCOUNT_DETAILS = null;
        console.error('Error authenticating:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Check if authenticated
 */
function isAuthenticated() {
    return !!ACCESS_TOKEN;
}

/**
 * Get an array of all trackers on the account
 */
async function getAllTrackers() {
    if (!isAuthenticated()) {
        console.log('Not authenticated.');
        throw new Error("Not authenticated, call connect(email, password) first.");
    }
    try {
        const url = `${TRAC_API_BASE}/user/${ACCOUNT_DETAILS.uid}/trackers`;
        const res = await axios.get(url, authHeader());
        return res.data;
    } catch (error) {
        console.error('Error getting trackers:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Get details of specified tracker
 */
async function getTracker(trackerID) {
    ensureAuthenticated();
    const url = `${TRAC_API_BASE}/tracker/${trackerID}`;
    const res = await axios.get(url, authHeader());
    return res.data;
}

/**
 * Get the history of locations for a specified tracker
 */
async function getTrackerHistory(trackerID, from, to) {
    ensureAuthenticated();
    const fromTimestamp = convertToUnixTimestamp(from);
    const toTimestamp = convertToUnixTimestamp(to);

    const url = `${TRAC_API_BASE}/tracker/${encodeURIComponent(trackerID)}/positions`;
    const params = {
        time_from: fromTimestamp,
        time_to: toTimestamp,
        format: 'json_segments'
    };
    const res = await axios.get(url, { ...authHeader(), params });

    // API returns an array of segments, return entire data (or first segment if preferred)
    return res.data[0] || [];
}

/**
 * Get latest position report for tracker (with address info)
 */
async function getTrackerLocation(trackerID) {
    ensureAuthenticated();

    const url = `${TRAC_API_BASE}/device_pos_report/${trackerID}`;
    const res = await axios.get(url, authHeader());
    const positionData = res.data;

    if (!positionData || !positionData.latlong || positionData.latlong.length < 2) {
        throw new Error(`Tracker location unavailable or incomplete.`);
    }

    const [latitude, longitude] = positionData.latlong;
    const addressUrl = `${TRAC_API_BASE}/platform/geo/address/location`;
    const addressRes = await axios.get(addressUrl, {
        ...authHeader(),
        params: { latitude, longitude }
    });

    positionData.address = addressRes.data;

    return positionData;
}

/**
 * Get latest hardware report for tracker
 */
async function getTrackerHardware(trackerID) {
    ensureAuthenticated();
    const url = `${TRAC_API_BASE}/device_hw_report/${trackerID}`;
    const res = await axios.get(url, authHeader());
    return res.data;
}

/**
 * Helper to throw if not authenticated
 */
function ensureAuthenticated() {
    if (!isAuthenticated()) {
        throw new Error("Not authenticated, call connect(email, password) first.");
    }
}

/**
 * Helper to convert JS Date object or timestamp to Unix timestamp (seconds)
 */
function convertToUnixTimestamp(date) {
    if (typeof date === 'number') return Math.floor(date);
    if (date instanceof Date) return Math.floor(date.getTime() / 1000);
    throw new Error("Invalid Date or timestamp provided.");
}

/**
 * Helper function to get auth header
 */
function authHeader() {
    return {
        headers: {
            'X-Tractive-Client': TRACTIVE_CLIENT,
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
}

module.exports = {
    connect,
    isAuthenticated,
    getAllTrackers,
    getTracker,
    getTrackerHistory,
    getTrackerLocation,
    getTrackerHardware
};
