import {
  loadPaymentMandateById,
  loadPaymentMandateBySecret,
  mandateIdFromSecret,
  PaymentMandate,
  savePaymentMandate,
} from "@/payments/entities";

type GetPaymentMandateBy =
  | { accountId: string; idOrSecret: string }
  | { secret: string };

export const getPaymentMandate = async (
  query: GetPaymentMandateBy & { live: boolean }
): Promise<PaymentMandate | null> => {
  let mandate: PaymentMandate | null = null;

  if ("accountId" in query) {
    const mandateId = mandateIdFromSecret(query.idOrSecret);

    mandate = await loadPaymentMandateById({
      accountId: query.accountId,
      mandateId,
      live: query.live,
    });
  } else {
    mandate = await loadPaymentMandateBySecret({
      secret: query.secret,
      live: query.live,
    });
  }

  if (!mandate) {
    return null;
  }

  if (
    mandate.status === "active" &&
    mandate.expires_at &&
    new Date(mandate.expires_at).getTime() < Date.now()
  ) {
    const expiredMandate: PaymentMandate = PaymentMandate.parse({
      ...mandate,
      status: "inactive",
      inactive_reason: "expired",
    });
    await savePaymentMandate({ paymentMandate: expiredMandate });
    return expiredMandate;
  }

  return mandate;
};
