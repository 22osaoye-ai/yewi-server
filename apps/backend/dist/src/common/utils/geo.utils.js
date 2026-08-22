"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoUtils = void 0;
class GeoUtils {
    static EARTH_RADIUS_KM = 6371;
    static calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const toRadians = (degrees) => (degrees * Math.PI) / 180;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) *
                Math.cos(toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(this.EARTH_RADIUS_KM * c * 100) / 100;
    }
    static isWithinRadius(proLat, proLon, targetLat, targetLon, radiusKm) {
        const distance = this.calculateHaversineDistance(proLat, proLon, targetLat, targetLon);
        return distance <= radiusKm;
    }
}
exports.GeoUtils = GeoUtils;
//# sourceMappingURL=geo.utils.js.map