/**
 * Utilidades geoespaciales para el cálculo de distancias y matching en ProntoPro
 */
export class GeoUtils {
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calcula la distancia en kilómetros entre dos pares de coordenadas geográficas usando la fórmula de Haversine
   */
  static calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(this.EARTH_RADIUS_KM * c * 100) / 100;
  }

  /**
   * Verifica si un punto geográfico se encuentra dentro del radio de servicio en km
   */
  static isWithinRadius(
    proLat: number,
    proLon: number,
    targetLat: number,
    targetLon: number,
    radiusKm: number,
  ): boolean {
    const distance = this.calculateHaversineDistance(
      proLat,
      proLon,
      targetLat,
      targetLon,
    );
    return distance <= radiusKm;
  }
}
