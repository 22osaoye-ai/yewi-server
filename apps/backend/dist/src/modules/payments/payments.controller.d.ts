import type { Request } from 'express';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';
interface RawBodyRequest extends Request {
    rawBody?: Buffer;
}
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
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
    handleWebhook(signature: string, req: RawBodyRequest): {
        received: boolean;
        simulated: boolean;
    } | {
        received: boolean;
        simulated?: undefined;
    };
}
export {};
