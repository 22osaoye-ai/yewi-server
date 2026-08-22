export declare class AntiFraudUtils {
    private static readonly EMAIL_REGEX;
    private static readonly PHONE_REGEX;
    private static readonly MESSENGER_LINKS_REGEX;
    static containsExternalContactInfo(text: string): boolean;
    static sanitizeText(text: string): string;
}
