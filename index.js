const tractive = require('./tractive');

const RADIUS = 30;

module.exports.handler = async (event) => {
  const fitziInfo = await getFritziInfo();
  const response = {
    "statusCode": 200,
    "headers": {
      "Access-Control-Allow-Origin": '*',
    },
    "body": JSON.stringify(fitziInfo)
  }
  return response;
};

async function getFritziInfo() {
  if (!process.env.TRACTIVE_EMAIL || !process.env.TRACTIVE_PASSWORD) {
    throw new Error("Missing Tractive credentials in environment variables");
  }

  await tractive.connect(process.env.TRACTIVE_EMAIL, process.env.TRACTIVE_PASSWORD);

  let connected = tractive.isAuthenticated();
  if (!connected) {
    throw new Error("Authentication with Tractive failed. Check credentials.");
  }

  // First, get list of available trackers
  console.log("Getting list of available trackers...");
  const trackers = await tractive.getAllTrackers();
  console.log("Available trackers:", trackers);

  if (!process.env.TRACKER_ID) {
    throw new Error("Missing TRACKER_ID in environment variables");
  }

  let info = await tractive.getTrackerLocation(process.env.TRACKER_ID);
  console.info(info);
  if (!info || !info.latlong || info.latlong.length < 2) {
    throw new Error("Invalid or empty location response from Tractive API");
  }

  if (!process.env.HOME_LATITUDE || !process.env.HOME_LONGITUDE) {
    throw new Error("Missing home coordinates in environment variables");
  }

  const lat1 = parseFloat(process.env.HOME_LATITUDE);
  const lon1 = parseFloat(process.env.HOME_LONGITUDE);

  const [lat2, lon2] = info.latlong;

  const distance = distanceInMetres(lat1, lon1, lat2, lon2);
  const isHome = distance < RADIUS;
  return {
    distance: distance,
    isHome: isHome,
    latlong: [lat2, lon2]
  };
}

module.exports.getFritziInfo = getFritziInfo;

function distanceInMetres(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
}