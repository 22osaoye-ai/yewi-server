"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntiFraudUtils = void 0;
class AntiFraudUtils {
    static EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    static PHONE_REGEX = /(?:(?:\+?(\d{1,3}))?[-. (]*(\d{2,4})[-. )]*(\d{2,4})[-. ]*(\d{2,4})(?:[-. ]*(\d{2,4}))?)|(?:\b\d{9,12}\b)/g;
    static MESSENGER_LINKS_REGEX = /(?:https?:\/\/)?(?:t\.me|wa\.me|api\.whatsapp\.com|instagram\.com|discord\.gg|facebook\.com)\/[a-zA-Z0-9_.-]+/gi;
    static containsExternalContactInfo(text) {
        if (!text)
            return false;
        return (this.EMAIL_REGEX.test(text) ||
            this.PHONE_REGEX.test(text) ||
            this.MESSENGER_LINKS_REGEX.test(text));
    }
    static sanitizeText(text) {
        if (!text)
            return text;
        let sanitized = text.replace(this.EMAIL_REGEX, '[CORREO OCULTO - DESBLOQUEA EL CONTACTO O FORMALIZA EL PEDIDO]');
        sanitized = sanitized.replace(this.MESSENGER_LINKS_REGEX, '[ENLACE EXTERNO BLOQUEADO]');
        sanitized = sanitized.replace(this.PHONE_REGEX, '[TELÉFONO OCULTO - DESBLOQUEA EL CONTACTO O FORMALIZA EL PEDIDO]');
        return sanitized;
    }
}
exports.AntiFraudUtils = AntiFraudUtils;
//# sourceMappingURL=anti-fraud.utils.js.map