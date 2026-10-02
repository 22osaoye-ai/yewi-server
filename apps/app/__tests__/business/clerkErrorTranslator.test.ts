import { translateClerkError } from '@/utils/clerkErrorTranslator';

describe('translateClerkError', () => {
  describe('Direct Error Codes', () => {
    it('translates form_password_length_too_short correctly', () => {
      const result = translateClerkError({ code: 'form_password_length_too_short' });
      expect(result).toBe('La contraseña debe tener al menos 8 caracteres.');
    });

    it('translates form_identifier_exists correctly', () => {
      const result = translateClerkError({ code: 'form_identifier_exists' });
      expect(result).toBe('Ya existe una cuenta registrada con este correo electrónico.');
    });

    it('translates form_password_pwned (vulnerada/filtrada) correctly', () => {
      const result = translateClerkError({ code: 'form_password_pwned' });
      expect(result).toBe('Esta contraseña es poco segura o ha sido vulnerada en la red. Elige una más segura.');
    });

    it('translates form_password_validation_failed correctly', () => {
      const result = translateClerkError({ code: 'form_password_validation_failed' });
      expect(result).toBe('La contraseña debe incluir al menos una mayúscula, una minúscula y un número.');
    });

    it('translates form_password_complexity_failed correctly', () => {
      const result = translateClerkError({ code: 'form_password_complexity_failed' });
      expect(result).toBe('La contraseña debe incluir al menos una mayúscula, una minúscula y un número.');
    });

    it('translates form_password_not_strong_enough correctly', () => {
      const result = translateClerkError({ code: 'form_password_not_strong_enough' });
      expect(result).toBe('Esta contraseña es muy predecible o débil. Elige una más segura.');
    });

    it('translates verification errors correctly', () => {
      expect(translateClerkError({ code: 'form_code_incorrect' })).toBe('El código de verificación es incorrecto.');
      expect(translateClerkError({ code: 'verification_expired' })).toBe('El código de verificación ha expirado. Por favor, solicita uno nuevo.');
    });
  });

  describe('Priority and Precedence (Anti-Regression for User Issue)', () => {
    it('prioritizes top-level error code when fields contain stale password error', () => {
      // SCENARIO: User typed a short password earlier, Clerk set fields.password.code = form_password_length_too_short.
      // User then enters 10+ character valid password, but email already exists (form_identifier_exists).
      const poisonedError = {
        code: 'form_identifier_exists',
        message: 'Identifier already exists',
        fields: {
          password: {
            code: 'form_password_length_too_short',
            message: 'Password must be at least 8 characters',
          },
        },
      };

      const result = translateClerkError(poisonedError);
      // It MUST NOT say password length error!
      expect(result).toBe('Ya existe una cuenta registrada con este correo electrónico.');
    });

    it('prioritizes errors[0] code when fields contain stale password error', () => {
      const clerkErrorResponse = {
        errors: [
          {
            code: 'form_identifier_exists',
            message: 'That email address is taken. Please try another.',
          },
        ],
        fields: {
          password: {
            code: 'form_password_length_too_short',
          },
        },
      };

      const result = translateClerkError(clerkErrorResponse);
      expect(result).toBe('Ya existe una cuenta registrada con este correo electrónico.');
    });

    it('prioritizes identifier errors over password errors in fields', () => {
      const multiFieldError = {
        fields: {
          identifier: {
            code: 'form_identifier_exists',
            message: 'Email already exists',
          },
          password: {
            code: 'form_password_length_too_short',
          },
        },
      };

      const result = translateClerkError(multiFieldError);
      expect(result).toBe('Ya existe una cuenta registrada con este correo electrónico.');
    });

    it('does NOT mask password complexity error with 8 characters message', () => {
      const complexityError = {
        code: 'form_password_complexity_failed',
        message: 'Password must contain at least 1 uppercase and 1 number',
      };

      const result = translateClerkError(complexityError);
      expect(result).toBe('La contraseña debe incluir al menos una mayúscula, una minúscula y un número.');
      expect(result).not.toContain('8 caracteres');
    });

    it('does NOT mask pwned password error with 8 characters message', () => {
      const pwnedError = {
        code: 'form_password_pwned',
        message: 'Password has been found in an online data breach',
      };

      const result = translateClerkError(pwnedError);
      expect(result).toBe('Esta contraseña es poco segura o ha sido vulnerada en la red. Elige una más segura.');
      expect(result).not.toContain('8 caracteres');
    });
  });

  describe('Semantic String Parsing (Clerk raw messages)', () => {
    it('correctly maps email taken text message', () => {
      const result = translateClerkError('That email address is already in use.');
      expect(result).toBe('Ya existe una cuenta registrada con este correo electrónico. Inicia sesión.');
    });

    it('correctly maps password complexity text message', () => {
      const result = translateClerkError('Password must contain at least one uppercase letter and one number');
      expect(result).toBe('La contraseña debe incluir al menos una mayúscula, una minúscula y un número.');
    });

    it('correctly maps network failure text message', () => {
      const result = translateClerkError('Network request failed');
      expect(result).toBe('Error de conexión con el servidor. Comprueba tu red Wi-Fi o datos móviles.');
    });

    it('returns custom fallback when error is null or undefined', () => {
      expect(translateClerkError(null, 'Error de prueba')).toBe('Error de prueba');
      expect(translateClerkError(undefined, 'Error por defecto')).toBe('Error por defecto');
    });
  });
});
