declare const _default: () => {
    port: number;
    nodeEnv: string;
    apiPrefix: string;
    appName: string;
    database: {
        url: string | undefined;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiration: string;
        refreshSecret: string | undefined;
        refreshExpiration: string;
    };
    throttle: {
        ttl: number;
        limit: number;
    };
    cors: {
        origin: string | string[];
    };
    business: {
        platformCommission: number;
        maxProsPerLead: number;
        autoCompleteDays: number;
        defaultCreditPrice: number;
    };
    stripe: {
        secretKey: string | undefined;
        webhookSecret: string | undefined;
    };
    storage: {
        driver: string;
        localPath: string;
    };
};
export default _default;
