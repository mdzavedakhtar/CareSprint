const EARTH_RADIUS_KM = 6371;

const ALLOWED_SERVICE_ZONES = ["BHILAI", "DURG", "RAIPUR"];

// Geographic bounding box approximations for Bhilai, Durg, Raipur region
const SERVICE_ZONE_BOUNDS = {
  minLng: 81.0,
  maxLng: 82.0,
  minLat: 20.8,
  maxLat: 21.6,
};

/**
 * Validate GeoJSON longitude and latitude coordinates.
 */
const validateCoordinates = (longitude, latitude) => {
  const lng = Number(longitude);
  const lat = Number(latitude);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return { valid: false, message: "Longitude and latitude must be valid finite numbers" };
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, message: "Longitude must be between -180 and 180 degrees" };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, message: "Latitude must be between -90 and 90 degrees" };
  }

  // Detect swapped latitude and longitude (e.g. in India lat is ~21°N, lng is ~81°E)
  if (
    (Math.abs(lng) <= 90 && Math.abs(lat) > 90) ||
    (lng >= 8 && lng <= 38 && lat >= 68 && lat <= 98)
  ) {
    return { valid: false, message: "Latitude and longitude values appear to be swapped" };
  }

  return { valid: true, longitude: lng, latitude: lat };
};

/**
 * Check if a city or coordinate falls within allowed service zones (Bhilai, Durg, Raipur).
 */
const isAllowedServiceZone = (city, coordinates) => {
  if (city && typeof city === "string") {
    const cleanCity = city.trim().toUpperCase();
    if (ALLOWED_SERVICE_ZONES.some((zone) => cleanCity.includes(zone))) {
      return true;
    }
  }

  if (Array.isArray(coordinates) && coordinates.length === 2) {
    const [lng, lat] = coordinates;
    if (
      lng >= SERVICE_ZONE_BOUNDS.minLng &&
      lng <= SERVICE_ZONE_BOUNDS.maxLng &&
      lat >= SERVICE_ZONE_BOUNDS.minLat &&
      lat <= SERVICE_ZONE_BOUNDS.maxLat
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Calculate distance between two GeoJSON points [lng, lat] using Haversine formula.
 */
const calculateHaversineDistance = (coord1, coord2) => {
  if (!Array.isArray(coord1) || coord1.length !== 2 || !Array.isArray(coord2) || coord2.length !== 2) {
    return null;
  }

  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

/**
 * Calculate approximate ETA in minutes based on distance.
 */
const calculateETA = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined) {
    return null;
  }

  const averageSpeedKmph = 30; // 30 km/h urban average
  const minutes = (distanceKm / averageSpeedKmph) * 60;
  return Math.max(3, Math.ceil(minutes));
};

module.exports = {
  validateCoordinates,
  isAllowedServiceZone,
  calculateHaversineDistance,
  calculateETA,
  ALLOWED_SERVICE_ZONES,
};
