/**
 * Spanish Tax ID (NIF / NIE / CIF) Validator Utility according to official Spanish AEAT specification.
 */

// Official DNI/NIE Control Letter Map
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function validateSpanishNifCifNie(value: string): {
  isValid: boolean;
  type: 'NIF' | 'NIE' | 'CIF' | 'INVALID';
  message?: string;
} {
  if (!value || typeof value !== 'string') {
    return { isValid: false, type: 'INVALID', message: 'NIF/CIF es obligatorio' };
  }

  const str = value.trim().toUpperCase().replace(/[\s-]/g, '');

  if (str.length !== 9) {
    return { isValid: false, type: 'INVALID', message: 'Debe contener exactamente 9 caracteres' };
  }

  // 1. NIF Validation (8 digits + 1 control letter)
  if (/^[0-9]{8}[A-Z]$/.test(str)) {
    const num = parseInt(str.substring(0, 8), 10);
    const expectedLetter = DNI_LETTERS[num % 23];
    if (str[8] === expectedLetter) {
      return { isValid: true, type: 'NIF' };
    }
    return {
      isValid: false,
      type: 'INVALID',
      message: `Letra de control incorrecta. Se esperaba '${expectedLetter}'`,
    };
  }

  // 2. NIE Validation (X/Y/Z + 7 digits + 1 control letter)
  if (/^[XYZ][0-9]{7}[A-Z]$/.test(str)) {
    let prefixNum = '0';
    if (str[0] === 'Y') prefixNum = '1';
    if (str[0] === 'Z') prefixNum = '2';

    const num = parseInt(prefixNum + str.substring(1, 8), 10);
    const expectedLetter = DNI_LETTERS[num % 23];
    if (str[8] === expectedLetter) {
      return { isValid: true, type: 'NIE' };
    }
    return {
      isValid: false,
      type: 'INVALID',
      message: `Letra de control de NIE incorrecta. Se esperaba '${expectedLetter}'`,
    };
  }

  // 3. CIF Validation (Organization letter A/B/C/D/E/F/G/H/J/N/P/Q/R/S/U/V/W + 7 digits + control)
  if (/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(str)) {
    const digits = str.substring(1, 8);
    let evenSum = 0;
    let oddSum = 0;

    for (let i = 0; i < digits.length; i++) {
      const d = parseInt(digits[i], 10);
      if (i % 2 === 0) {
        // Odd positions (1-indexed: 1, 3, 5, 7)
        const doubled = d * 2;
        oddSum += doubled > 9 ? doubled - 9 : doubled;
      } else {
        // Even positions (1-indexed: 2, 4, 6)
        evenSum += d;
      }
    }

    const totalSum = evenSum + oddSum;
    const lastDigitOfSum = totalSum % 10;
    const controlNum = lastDigitOfSum === 0 ? 0 : 10 - lastDigitOfSum;
    const controlLetter = String.fromCharCode(64 + controlNum);

    const actualControl = str[8];
    const isControlNumValid = actualControl === controlNum.toString();
    const isControlLetterValid = actualControl === controlLetter;

    if (isControlNumValid || isControlLetterValid) {
      return { isValid: true, type: 'CIF' };
    }

    return { isValid: false, type: 'INVALID', message: 'Dígito/Letra de control de CIF inválido' };
  }

  return { isValid: false, type: 'INVALID', message: 'Formato de NIF, NIE o CIF no reconocido' };
}
