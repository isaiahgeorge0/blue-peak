/*
  Where each service area sits relative to Ipswich, for the distance diagram
  on /about. Coordinates are the primary coordinates of each town's Wikipedia
  article (October 2026). Distances are great-circle miles and bearings are
  initial bearings, clockwise from north.
*/

type LatLon = { lat: number; lon: number };

export const areaCoordinates: Record<string, LatLon> = {
  ipswich: { lat: 52.059444, lon: 1.155556 },
  woodbridge: { lat: 52.093889, lon: 1.32 },
  felixstowe: { lat: 51.9639, lon: 1.3514 },
  colchester: { lat: 51.8917, lon: 0.903 },
};

const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Miles and bearing (degrees from north) from `from` to `to`. */
export function distanceAndBearing(from: LatLon, to: LatLon) {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLat = lat2 - lat1;
  const dLon = toRadians(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const miles = 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return { miles, bearing };
}

/** Each area's distance and bearing from Ipswich; Ipswich itself is 0. */
export function areaPositions() {
  return Object.fromEntries(
    Object.entries(areaCoordinates).map(([slug, coordinates]) => [
      slug,
      distanceAndBearing(areaCoordinates.ipswich, coordinates),
    ]),
  );
}
