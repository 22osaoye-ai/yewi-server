import { AntiFraudUtils } from './anti-fraud.utils';

describe('AntiFraudUtils', () => {
  it('should detect email addresses in text', () => {
    const text =
      'Hola, escríbeme a mi email juan.perez@gmail.com para coordinar';
    expect(AntiFraudUtils.containsExternalContactInfo(text)).toBe(true);
  });

  it('should detect phone numbers in text', () => {
    const text = 'Llámame al 611223344 o al +34 622 33 44 55';
    expect(AntiFraudUtils.containsExternalContactInfo(text)).toBe(true);
  });

  it('should detect external messaging links (WhatsApp, Telegram)', () => {
    const text = 'Hablemos por wa.me/34600000000 o t.me/usuario';
    expect(AntiFraudUtils.containsExternalContactInfo(text)).toBe(true);
  });

  it('should sanitize and mask contact information', () => {
    const text = 'Mi contacto es contacto@test.com y tel 611223344';
    const sanitized = AntiFraudUtils.sanitizeText(text);

    expect(sanitized).not.toContain('contacto@test.com');
    expect(sanitized).not.toContain('611223344');
    expect(sanitized).toContain('CORREO OCULTO');
    expect(sanitized).toContain('TELÉFONO OCULTO');
  });

  it('should not alter legitimate text without contacts', () => {
    const text = 'Necesito reparar la cisterna del baño principal.';
    expect(AntiFraudUtils.containsExternalContactInfo(text)).toBe(false);
    expect(AntiFraudUtils.sanitizeText(text)).toBe(text);
  });
});
