export function circleRing(lat: number, lng: number, radiusM: number, steps = 64): [number, number][] {
  const coords: [number, number][] = [];
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    coords.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return coords;
}

export function routeLine(route: [number, number][]): [number, number][] {
  return route.map(([lat, lng]) => [lng, lat]);
}
