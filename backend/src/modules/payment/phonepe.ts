/**
 * PhonePe client — ported from src/lib/phonepay.ts. Same API surface.
 * Uses node's crypto module instead of crypto-js (zero extra dependency).
 */
import axios from 'axios';
import crypto from 'crypto';

export interface PhonePeResponse {
  success: boolean;
  code?: string;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
}

export class PhonePePayment {
  constructor(
    private merchantId: string,
    private saltKey: string,
    private saltIndex: string,
    private env: 'UAT' | 'PROD' = 'UAT'
  ) {}

  private getBaseUrl(): string {
    return this.env === 'PROD'
      ? 'https://api.phonepe.com/apis/hermes'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
  }

  private generateXVerify(payload: string, endpoint: string): string {
    const sha256 = crypto.createHash('sha256').update(payload + endpoint + this.saltKey).digest('hex');
    return `${sha256}###${this.saltIndex}`;
  }

  async initiatePayment(
    amount: number,
    merchantTransactionId: string,
    callbackUrl: string,
    userDetails?: { name?: string; email?: string; phone?: string }
  ): Promise<PhonePeResponse> {
    try {
      const payload = {
        merchantId: this.merchantId,
        merchantTransactionId,
        amount: amount * 100,
        redirectUrl: callbackUrl,
        redirectMode: 'POST',
        callbackUrl,
        merchantUserId: `MUID${Date.now()}`,
        paymentInstrument: { type: 'PAY_PAGE' },
        ...(userDetails ? { userInfo: { ...userDetails } } : {}),
      };
      const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
      const xVerify = this.generateXVerify(base64, '/pg/v1/pay');
      const res = await axios.post(
        `${this.getBaseUrl()}/pg/v1/pay`,
        { request: base64 },
        { headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify } }
      );
      return { success: true, ...(res.data as Record<string, unknown>) };
    } catch (err) {
      return {
        success: false,
        code: 'ERROR',
        message: 'Failed to initiate payment',
        error: (err as Error).message,
      };
    }
  }

  async checkStatus(merchantTransactionId: string): Promise<PhonePeResponse> {
    try {
      const endpoint = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}`;
      const xVerify = this.generateXVerify('', endpoint);
      const res = await axios.get(`${this.getBaseUrl()}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': this.merchantId,
        },
      });
      return { success: true, ...(res.data as Record<string, unknown>) };
    } catch (err) {
      return {
        success: false,
        code: 'ERROR',
        message: 'Failed to check payment status',
        error: (err as Error).message,
      };
    }
  }
}
