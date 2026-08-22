import { GeoUtils } from './geo.utils';

describe('GeoUtils', () => {
  it('should calculate accurate distance between Madrid and Barcelona (~505 km)', () => {
    const madridLat = 40.4168;
    const madridLon = -3.7038;
    const barcelonaLat = 41.3879;
    const barcelonaLon = 2.1699;

    const distance = GeoUtils.calculateHaversineDistance(
      madridLat,
      madridLon,
      barcelonaLat,
      barcelonaLon,
    );

    expect(distance).toBeGreaterThan(500);
    expect(distance).toBeLessThan(510);
  });

  it('should return true if location is within pro coverage radius', () => {
    const proLat = 40.4168;
    const proLon = -3.7038;
    // Location ~10 km away in Madrid
    const targetLat = 40.45;
    const targetLon = -3.69;

    const isWithin = GeoUtils.isWithinRadius(
      proLat,
      proLon,
      targetLat,
      targetLon,
      25,
    );
    expect(isWithin).toBe(true);
  });

  it('should return false if location is outside pro coverage radius', () => {
    const proLat = 40.4168;
    const proLon = -3.7038;
    const targetLat = 41.3879; // Barcelona
    const targetLon = 2.1699;

    const isWithin = GeoUtils.isWithinRadius(
      proLat,
      proLon,
      targetLat,
      targetLon,
      50,
    );
    expect(isWithin).toBe(false);
  });
});
