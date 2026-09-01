export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'USER_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'INVALID_OTP'
  | 'PHONE_AUTH_FAILED'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'El correo o la contraseña son incorrectos.',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta registrada con este correo electrónico.',
  INVALID_EMAIL: 'El formato del correo electrónico no es válido.',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres.',
  USER_NOT_FOUND: 'No se encontró ningún usuario con estos datos.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu acceso a internet.',
  INVALID_OTP: 'El código de verificación SMS es incorrecto o ha expirado.',
  PHONE_AUTH_FAILED: 'No se pudo verificar el número de teléfono.',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción.',
  UNKNOWN: 'Ocurrió un error inesperado en la autenticación.',
};

export class AuthError extends Error {
  public readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, customMessage?: string) {
    const message = customMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
