import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
export declare class PaymentsService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private stripe;
    constructor(configService: ConfigService, prisma: PrismaService);
    createPaymentIntent(userId: string, dto: CreatePaymentIntentDto): Promise<{
        clientSecret: string;
        paymentIntentId: string;
        amount: number;
        currency: string;
        status: string;
        isMock: boolean;
    } | {
        clientSecret: string | null;
        paymentIntentId: string;
        amount: number;
        currency: string;
        status: import("node_modules/stripe/cjs/resources/PaymentIntents").PaymentIntent.Status;
        isMock?: undefined;
    }>;
    handleWebhook(signature: string, payload: Buffer): {
        received: boolean;
        simulated: boolean;
    } | {
        received: boolean;
        simulated?: undefined;
    };
}
