export declare class GeoUtils {
    private static readonly EARTH_RADIUS_KM;
    static calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    static isWithinRadius(proLat: number, proLon: number, targetLat: number, targetLon: number, radiusKm: number): boolean;
}
