/**
 * Configuración oficial de países y prefijos telefónicos para Yewi.
 * Países autorizados para la fase de lanzamiento: España, Francia y Reino Unido.
 */

export interface SupportedCountry {
  code: 'ES' | 'FR' | 'GB';
  name: string;
  prefix: string;
  flag: string;
  digitsLength: number;
  placeholder: string;
  regex: RegExp;
}

export const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  {
    code: 'ES',
    name: 'España',
    prefix: '+34',
    flag: '🇪🇸',
    digitsLength: 9,
    placeholder: '612 345 678',
    regex: /^[6789]\d{8}$/,
  },
  {
    code: 'FR',
    name: 'Francia',
    prefix: '+33',
    flag: '🇫🇷',
    digitsLength: 9,
    placeholder: '6 12 34 56 78',
    regex: /^[1-9]\d{8}$/,
  },
  {
    code: 'GB',
    name: 'Reino Unido',
    prefix: '+44',
    flag: '🇬🇧',
    digitsLength: 10,
    placeholder: '7123 456789',
    regex: /^[1-9]\d{9}$/,
  },
];

export const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0]; // España

/**
 * Obtiene la configuración de país por código ISO o prefijo
 */
export function getCountryByCodeOrPrefix(codeOrPrefix?: string): SupportedCountry {
  if (!codeOrPrefix) return DEFAULT_COUNTRY;
  const match = SUPPORTED_COUNTRIES.find(
    (c) =>
      c.code.toUpperCase() === codeOrPrefix.toUpperCase() ||
      c.prefix === codeOrPrefix ||
      c.name.toLowerCase() === codeOrPrefix.toLowerCase()
  );
  return match || DEFAULT_COUNTRY;
}

export interface PhoneValidationResult {
  isValid: boolean;
  message?: string;
  e164?: string;
  cleanNationalDigits: string;
}

/**
 * Valida un número de teléfono de acuerdo con el país y prefijo seleccionados.
 * Aplica regla estricta: un usuario en España DEBE usar +34, en Francia +33, etc.
 */
export function validatePhoneNumber(
  countryCode: 'ES' | 'FR' | 'GB' | string,
  prefix: string,
  rawNationalNumber: string
): PhoneValidationResult {
  const country = getCountryByCodeOrPrefix(countryCode);

  // 1. Validar correspondencia estricta país <-> prefijo
  if (country.prefix !== prefix) {
    return {
      isValid: false,
      message: `El prefijo ${prefix} no corresponde a ${country.name}. Debe ser ${country.prefix}.`,
      cleanNationalDigits: '',
    };
  }

  // 2. Limpiar caracteres no numéricos
  const cleanDigits = (rawNationalNumber || '').replace(/\D/g, '');

  if (!cleanDigits) {
    return {
      isValid: false,
      message: 'Por favor, ingresa el número de teléfono.',
      cleanNationalDigits: '',
    };
  }

  // 3. Validar longitud exacta de dígitos nacionales
  if (cleanDigits.length < country.digitsLength) {
    return {
      isValid: false,
      message: `El teléfono para ${country.name} debe tener ${country.digitsLength} dígitos (faltan ${country.digitsLength - cleanDigits.length}).`,
      cleanNationalDigits: cleanDigits,
    };
  }

  if (cleanDigits.length > country.digitsLength) {
    return {
      isValid: false,
      message: `El teléfono para ${country.name} no puede exceder ${country.digitsLength} dígitos.`,
      cleanNationalDigits: cleanDigits,
    };
  }

  // 4. Validar patrón regex del país
  if (!country.regex.test(cleanDigits)) {
    if (country.code === 'ES') {
      return {
        isValid: false,
        message: 'En España los números móviles y fijos deben comenzar con 6, 7, 8 o 9.',
        cleanNationalDigits: cleanDigits,
      };
    }
    return {
      isValid: false,
      message: `El formato del número no es válido para ${country.name}.`,
      cleanNationalDigits: cleanDigits,
    };
  }

  const e164 = `${country.prefix}${cleanDigits}`;

  return {
    isValid: true,
    e164,
    cleanNationalDigits: cleanDigits,
  };
}

/**
 * Formatea visualmente los dígitos de un teléfono según el país
 */
export function formatPhoneDisplay(countryCode: string, rawDigits: string): string {
  const clean = rawDigits.replace(/\D/g, '');
  if (countryCode === 'ES') {
    // 612 345 678
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
  }
  if (countryCode === 'FR') {
    // 6 12 34 56 78
    if (clean.length <= 1) return clean;
    if (clean.length <= 3) return `${clean.slice(0, 1)} ${clean.slice(1)}`;
    if (clean.length <= 5) return `${clean.slice(0, 1)} ${clean.slice(1, 3)} ${clean.slice(3)}`;
    if (clean.length <= 7) return `${clean.slice(0, 1)} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5)}`;
    return `${clean.slice(0, 1)} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)}`;
  }
  if (countryCode === 'GB') {
    // 7123 456789
    if (clean.length <= 4) return clean;
    return `${clean.slice(0, 4)} ${clean.slice(4, 10)}`;
  }
  return clean;
}
