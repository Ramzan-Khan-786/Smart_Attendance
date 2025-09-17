// Haversine distance formula
export const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Point-in-polygon algorithm (Ray casting)
const isPointInPolygon = (point, polygon) => {
  const [px, py] = point;
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) {
      isInside = !isInside;
    }
  }
  return isInside;
};

export const isWithinGeofence = (userCoords, location) => {
  if (!userCoords || !location) return false;

  if (location.shapeType === "Circle") {
    const distanceKm = getDistanceFromLatLonInKm(
      userCoords.latitude,
      userCoords.longitude,
      location.center.lat,
      location.center.lng
    );
    return distanceKm * 1000 <= location.radius;
  }

  if (location.shapeType === "Polygon") {
    const point = [userCoords.longitude, userCoords.latitude];
    const polygon = location.path.map((p) => [p.lng, p.lat]);
    return isPointInPolygon(point, polygon);
  }

  return false;
};
