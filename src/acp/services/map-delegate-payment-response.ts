import { DelegatePaymentResponse as ACPDelegatePaymentResponse } from "@/acp/interfaces";
import { PaymentMandate } from "@/payments/entities";

export const mapDelegatePaymentResponse = (
  paymentMandate: PaymentMandate
): ACPDelegatePaymentResponse => {
  return ACPDelegatePaymentResponse.parse({
    id: paymentMandate.secret,
    created: paymentMandate.created_at,
    metadata: paymentMandate.metadata,
  });
};
