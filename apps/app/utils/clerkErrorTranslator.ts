/**
 * Traductor de errores de Clerk y autenticación a Español estándar para Yewi
 */

const ERROR_CODE_TRANSLATIONS: Record<string, string> = {
  // Errores de sesión
  session_already_exists: 'Ya has iniciado sesión.',
  session_exists: 'Ya tienes una sesión activa en este dispositivo.',
  identifier_already_signed_in: 'Esta cuenta ya tiene una sesión iniciada.',
  
  // Errores de credenciales / formulario
  form_identifier_not_found: 'No encontramos ninguna cuenta con este correo electrónico.',
  form_password_incorrect: 'La contraseña introducida es incorrecta.',
  form_identifier_exists: 'Ya existe una cuenta registrada con este correo electrónico.',
  form_param_format_invalid: 'El formato de los datos ingresados no es válido.',
  form_param_nil: 'Por favor, completa todos los campos requeridos.',
  
  // Errores de contraseña
  form_password_length_too_short: 'La contraseña debe tener al menos 8 caracteres.',
  form_password_pwned: 'Esta contraseña es poco segura o ha sido vulnerada en la red. Elige una más segura.',
  form_password_size_in_bytes_exceeded: 'La contraseña es demasiado larga.',
  
  // Errores de verificación (código OTP / email)
  form_code_incorrect: 'El código de verificación es incorrecto.',
  verification_expired: 'El código de verificación ha expirado. Por favor, solicita uno nuevo.',
  verification_failed: 'No se pudo verificar el código. Inténtalo de nuevo.',
  
  // Límites y red
  too_many_requests: 'Demasiados intentos fallidos. Por favor, espera unos minutos e inténtalo de nuevo.',
  network_error: 'Error de conexión. Comprueba tu conexión a internet y vuelve a intentarlo.',
  oauth_access_denied: 'Inicio de sesión cancelado o denegado por el proveedor.',
};

/**
 * Traduce cualquier error (string, objeto Clerk, Error de JS) al español.
 */
export function translateClerkError(err: any, fallbackMessage: string = 'Ha ocurrido un error en la autenticación.'): string {
  if (!err) return fallbackMessage;

  // 1. Si es un objeto de error de Clerk con array de errors
  const clerkErrorItem = err?.errors?.[0] || err?.fields?.identifier || err?.fields?.password || err?.fields?.code || err?.fields?.emailAddress;
  const code = clerkErrorItem?.code || err?.code;
  
  if (code && ERROR_CODE_TRANSLATIONS[code]) {
    return ERROR_CODE_TRANSLATIONS[code];
  }

  // 2. Extraer el mensaje original en texto
  const rawMessage: string = (
    clerkErrorItem?.longMessage ||
    clerkErrorItem?.message ||
    err?.message ||
    (typeof err === 'string' ? err : '')
  ).trim();

  if (!rawMessage) return fallbackMessage;

  const lower = rawMessage.toLowerCase();

  // 3. Coincidencias semánticas frecuentes de Clerk en inglés
  if (lower.includes('already signed') || lower.includes('already have an active session')) {
    return 'Ya has iniciado sesión. Entrando...';
  }
  if (lower.includes('couldn\'t find your account') || lower.includes('identifier not found')) {
    return 'No encontramos ninguna cuenta asociada a este correo electrónico.';
  }
  if (lower.includes('password is incorrect') || lower.includes('incorrect password') || lower.includes('invalid password')) {
    return 'La contraseña ingresada no es correcta.';
  }
  if (lower.includes('already exists') || lower.includes('taken') || lower.includes('already in use')) {
    return 'Ya existe una cuenta registrada con este correo electrónico. Inicia sesión.';
  }
  if (lower.includes('incorrect code') || lower.includes('invalid code') || lower.includes('code is incorrect')) {
    return 'El código de verificación introducido es incorrecto.';
  }
  if (lower.includes('expired') || lower.includes('has expired')) {
    return 'El código de verificación ha expirado. Solicita un nuevo código.';
  }
  if (lower.includes('at least 8 characters') || lower.includes('password length')) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Demasiados intentos. Por seguridad, espera unos minutos.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Error de conexión con el servidor. Comprueba tu red Wi-Fi o datos móviles.';
  }
  if (lower.includes('canceled') || lower.includes('cancelled') || lower.includes('dismissed')) {
    return 'Inicio de sesión cancelado.';
  }

  return rawMessage;
}
