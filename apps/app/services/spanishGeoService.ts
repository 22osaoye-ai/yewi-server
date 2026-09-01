import * as Location from 'expo-location';

export interface AutonomousRegion {
  name: string;
  provinces: Province[];
}

export interface Province {
  code: string;
  name: string;
  regionName: string;
}

export interface Locality {
  code?: string;
  name: string;
  provinceCode: string;
  postalCodePrefix?: string;
}

export interface StreetCandidate {
  name: string;
  postalCode: string;
  locality?: string;
  province?: string;
}

// Complete 17 Autonomous Communities + 2 Autonomous Cities & all 50 official provinces
export const SPANISH_REGIONS: AutonomousRegion[] = [
  {
    name: 'Andalucía',
    provinces: [
      { code: '04', name: 'Almería', regionName: 'Andalucía' },
      { code: '11', name: 'Cádiz', regionName: 'Andalucía' },
      { code: '14', name: 'Córdoba', regionName: 'Andalucía' },
      { code: '18', name: 'Granada', regionName: 'Andalucía' },
      { code: '21', name: 'Huelva', regionName: 'Andalucía' },
      { code: '23', name: 'Jaén', regionName: 'Andalucía' },
      { code: '29', name: 'Málaga', regionName: 'Andalucía' },
      { code: '41', name: 'Sevilla', regionName: 'Andalucía' },
    ],
  },
  {
    name: 'Aragón',
    provinces: [
      { code: '22', name: 'Huesca', regionName: 'Aragón' },
      { code: '44', name: 'Teruel', regionName: 'Aragón' },
      { code: '50', name: 'Zaragoza', regionName: 'Aragón' },
    ],
  },
  {
    name: 'Principado de Asturias',
    provinces: [{ code: '33', name: 'Asturias', regionName: 'Principado de Asturias' }],
  },
  {
    name: 'Illes Balears',
    provinces: [{ code: '07', name: 'Baleares', regionName: 'Illes Balears' }],
  },
  {
    name: 'Canarias',
    provinces: [
      { code: '35', name: 'Las Palmas', regionName: 'Canarias' },
      { code: '38', name: 'Santa Cruz de Tenerife', regionName: 'Canarias' },
    ],
  },
  {
    name: 'Cantabria',
    provinces: [{ code: '39', name: 'Cantabria', regionName: 'Cantabria' }],
  },
  {
    name: 'Castilla y León',
    provinces: [
      { code: '05', name: 'Ávila', regionName: 'Castilla y León' },
      { code: '09', name: 'Burgos', regionName: 'Castilla y León' },
      { code: '24', name: 'León', regionName: 'Castilla y León' },
      { code: '34', name: 'Palencia', regionName: 'Castilla y León' },
      { code: '37', name: 'Salamanca', regionName: 'Castilla y León' },
      { code: '40', name: 'Segovia', regionName: 'Castilla y León' },
      { code: '42', name: 'Soria', regionName: 'Castilla y León' },
      { code: '47', name: 'Valladolid', regionName: 'Castilla y León' },
      { code: '49', name: 'Zamora', regionName: 'Castilla y León' },
    ],
  },
  {
    name: 'Castilla-La Mancha',
    provinces: [
      { code: '02', name: 'Albacete', regionName: 'Castilla-La Mancha' },
      { code: '13', name: 'Ciudad Real', regionName: 'Castilla-La Mancha' },
      { code: '16', name: 'Cuenca', regionName: 'Castilla-La Mancha' },
      { code: '19', name: 'Guadalajara', regionName: 'Castilla-La Mancha' },
      { code: '45', name: 'Toledo', regionName: 'Castilla-La Mancha' },
    ],
  },
  {
    name: 'Cataluña',
    provinces: [
      { code: '08', name: 'Barcelona', regionName: 'Cataluña' },
      { code: '17', name: 'Girona', regionName: 'Cataluña' },
      { code: '25', name: 'Lleida', regionName: 'Cataluña' },
      { code: '43', name: 'Tarragona', regionName: 'Cataluña' },
    ],
  },
  {
    name: 'Comunitat Valenciana',
    provinces: [
      { code: '03', name: 'Alicante', regionName: 'Comunitat Valenciana' },
      { code: '12', name: 'Castellón', regionName: 'Comunitat Valenciana' },
      { code: '46', name: 'Valencia', regionName: 'Comunitat Valenciana' },
    ],
  },
  {
    name: 'Extremadura',
    provinces: [
      { code: '06', name: 'Badajoz', regionName: 'Extremadura' },
      { code: '10', name: 'Cáceres', regionName: 'Extremadura' },
    ],
  },
  {
    name: 'Galicia',
    provinces: [
      { code: '15', name: 'A Coruña', regionName: 'Galicia' },
      { code: '27', name: 'Lugo', regionName: 'Galicia' },
      { code: '32', name: 'Ourense', regionName: 'Galicia' },
      { code: '36', name: 'Pontevedra', regionName: 'Galicia' },
    ],
  },
  {
    name: 'Comunidad de Madrid',
    provinces: [{ code: '28', name: 'Madrid', regionName: 'Comunidad de Madrid' }],
  },
  {
    name: 'Región de Murcia',
    provinces: [{ code: '30', name: 'Murcia', regionName: 'Región de Murcia' }],
  },
  {
    name: 'Comunidad Foral de Navarra',
    provinces: [{ code: '31', name: 'Navarra', regionName: 'Comunidad Foral de Navarra' }],
  },
  {
    name: 'País Vasco',
    provinces: [
      { code: '01', name: 'Álava', regionName: 'País Vasco' },
      { code: '20', name: 'Gipuzkoa', regionName: 'País Vasco' },
      { code: '48', name: 'Bizkaia', regionName: 'País Vasco' },
    ],
  },
  {
    name: 'La Rioja',
    provinces: [{ code: '26', name: 'La Rioja', regionName: 'La Rioja' }],
  },
  {
    name: 'Ceuta',
    provinces: [{ code: '51', name: 'Ceuta', regionName: 'Ceuta' }],
  },
  {
    name: 'Melilla',
    provinces: [{ code: '52', name: 'Melilla', regionName: 'Melilla' }],
  },
];

export const SPANISH_PROVINCES: Province[] = SPANISH_REGIONS.flatMap((r) => r.provinces);

// Curated starter municipalities for instant offline availability before API fetch
const POPULAR_MUNICIPALITIES: Record<string, string[]> = {
  '50': ['Zaragoza', 'Calatayud', 'Utebo', 'Ejea de los Caballeros', 'Tarazona', 'Caspe', 'Tauste', 'Cuarte de Huerva', 'Zuera', 'Alagón'],
  '22': ['Huesca', 'Barbastro', 'Monzón', 'Jaca', 'Fraga', 'Sabiñánigo', 'Binéfar', 'Sariñena'],
  '44': ['Teruel', 'Alcañiz', 'Andorra', 'Calamocha', 'Calanda', 'Alcorisa', 'Utrillas', 'Cella'],
  '28': ['Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés', 'Getafe', 'Alcorcón', 'Torrejón de Ardoz', 'Parla', 'Alcobendas'],
  '08': ['Barcelona', 'L\'Hospitalet de Llobregat', 'Badalona', 'Terrassa', 'Sabadell', 'Mataró', 'Santa Coloma de Gramenet', 'Sant Cugat del Vallès'],
  '41': ['Sevilla', 'Dos Hermanas', 'Alcalá de Guadaíra', 'Utrera', 'Mairena del Aljarafe', 'Écija', 'La Rinconada', 'Los Palacios y Villafranca'],
  '46': ['Valencia', 'Torrent', 'Gandia', 'Paterna', 'Sagunto', 'Alzira', 'Mislata', 'Burjassot', 'Ontinyent', 'Aldaia'],
  '29': ['Málaga', 'Marbella', 'Mijas', 'Fuengirola', 'Vélez-Málaga', 'Torremolinos', 'Benalmádena', 'Estepona', 'Rincón de la Victoria'],
  '03': ['Alicante', 'Elche', 'Torrevieja', 'Orihuela', 'Benidorm', 'Alcoy', 'San Vicente del Raspeig', 'Elda', 'Dénia'],
};

export const spanishGeoService = {
  // 1. Search Provinces / Autonomous Regions
  searchProvinces(query?: string): Province[] {
    const q = (query || '').trim().toLowerCase();
    if (!q) return SPANISH_PROVINCES;

    // Direct autonomous region match (e.g. searching "Aragón" lists Huesca, Teruel, Zaragoza)
    const matchedRegion = SPANISH_REGIONS.find((r) => r.name.toLowerCase().includes(q));
    if (matchedRegion) {
      return matchedRegion.provinces;
    }

    return SPANISH_PROVINCES.filter(
      (p) => p.name.toLowerCase().includes(q) || p.regionName.toLowerCase().includes(q) || p.code === q
    );
  },

  // 2. Dynamic Fetch of Municipalities (Localities) for a Province
  async getLocalities(provinceCodeOrName: string, query?: string): Promise<Locality[]> {
    const prov = SPANISH_PROVINCES.find(
      (p) => p.code === provinceCodeOrName || p.name.toLowerCase() === provinceCodeOrName.toLowerCase()
    ) || SPANISH_PROVINCES[0];

    const provinceCode = prov.code;
    const provinceName = prov.name;
    const q = (query || '').trim().toLowerCase();

    // Fast local starter list
    const defaults = POPULAR_MUNICIPALITIES[provinceCode] || [provinceName, `${provinceName} Capital`];
    const initialList: Locality[] = defaults.map((name) => ({
      name,
      provinceCode,
      postalCodePrefix: `${provinceCode}0`,
    }));

    // If query is provided, query OpenStreetMap / Cartociudad API for real-time municipalities
    if (q.length >= 2) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=es&state=${encodeURIComponent(
          provinceName
        )}&city=${encodeURIComponent(q)}&featuretype=city&limit=10`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'YewiApp-GeoService/1.0' },
        });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const apiLocalities: Locality[] = data.map((item: any) => {
            const cityName = item.name || item.display_name.split(',')[0].trim();
            return {
              name: cityName,
              provinceCode,
              postalCodePrefix: `${provinceCode}0`,
            };
          });

          // Merge and deduplicate
          const combined = [...apiLocalities, ...initialList.filter((l) => l.name.toLowerCase().includes(q))];
          const unique = Array.from(new Map(combined.map((item) => [item.name.toLowerCase(), item])).values());
          return unique;
        }
      } catch (e) {
        // Fallback to local filtering
      }
    }

    if (!q) return initialList;
    return initialList.filter((l) => l.name.toLowerCase().includes(q));
  },

  // 3. Real-Time Street Search & Postal Code Lookup (IGN Cartociudad + Nominatim)
  async searchStreets(
    provinceName: string,
    cityName: string,
    streetQuery: string
  ): Promise<StreetCandidate[]> {
    const q = streetQuery.trim();
    if (q.length < 2) return [];

    // Strategy 1: Instituto Geográfico Nacional (IGN) - Cartociudad API (Official & Free Spanish Geocoder)
    try {
      const ignUrl = `https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=${encodeURIComponent(
        `${q}, ${cityName}, ${provinceName}`
      )}&limit=8`;
      const ignRes = await fetch(ignUrl);
      const ignData = await ignRes.json();

      if (Array.isArray(ignData) && ignData.length > 0) {
        return ignData
          .filter((item: any) => item.address || item.type === 'calle' || item.type === 'portal')
          .map((item: any) => ({
            name: item.address || item.description || q,
            postalCode: item.postalCode || item.muniPostalCode || `${item.provinceCode || '50'}001`,
            locality: item.municipality || cityName,
            province: item.province || provinceName,
          }));
      }
    } catch (e) {
      // Cartociudad fallback to Nominatim
    }

    // Strategy 2: OpenStreetMap Nominatim with Spanish Address Details
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        `${q}, ${cityName}, ${provinceName}, España`
      )}&format=json&countrycodes=es&addressdetails=1&limit=8`;
      const osmRes = await fetch(osmUrl, {
        headers: { 'User-Agent': 'YewiApp-GeoService/1.0' },
      });
      const osmData = await osmRes.json();

      if (Array.isArray(osmData) && osmData.length > 0) {
        return osmData.map((item: any) => {
          const addr = item.address || {};
          const road = addr.road || addr.pedestrian || addr.street || item.name || q;
          const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
          const fullStreet = `${road}${houseNumber}`;
          const postCode = addr.postcode || '50017';

          return {
            name: fullStreet,
            postalCode: postCode,
            locality: addr.city || addr.town || addr.village || cityName,
            province: addr.province || addr.state || provinceName,
          };
        });
      }
    } catch (e) {
      // Return typed candidate with fallback postal code
    }

    // Default return with province postal code prefix
    const prov = SPANISH_PROVINCES.find((p) => p.name.toLowerCase() === provinceName.toLowerCase());
    const defaultCP = prov ? `${prov.code}001` : '50001';

    return [
      {
        name: q,
        postalCode: defaultCP,
        locality: cityName,
        province: provinceName,
      },
    ];
  },

  // 4. GPS Auto-Detect Location with Spanish Hierarchy (Comunidad -> Provincia -> Municipio -> Calle -> CP)
  async detectGPSLocation(): Promise<{
    region: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
  }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode) {
          let province = geocode.subregion || geocode.city || 'Zaragoza';
          let region = geocode.region || 'Aragón';

          // Match exact province in SPANISH_PROVINCES
          const matchedProv = SPANISH_PROVINCES.find(
            (p) =>
              p.name.toLowerCase() === province.toLowerCase() ||
              p.name.toLowerCase() === (geocode.region || '').toLowerCase()
          );

          if (matchedProv) {
            province = matchedProv.name;
            region = matchedProv.regionName;
          }

          const city = geocode.city || geocode.subregion || `${province} Capital`;
          const street = geocode.street
            ? `${geocode.street} ${geocode.streetNumber || ''}`.trim()
            : 'Calle de Roger de Flor 23';
          const postalCode = geocode.postalCode || `${matchedProv?.code || '50'}001`;

          return {
            region,
            province,
            city,
            address: street,
            postalCode,
          };
        }
      }
    } catch {}

    // Default Fallback (Zaragoza, Aragón)
    return {
      region: 'Aragón',
      province: 'Zaragoza',
      city: 'Zaragoza',
      address: 'Calle de Roger de Flor 23',
      postalCode: '50017',
    };
  },
};
