import { FC } from "hono/jsx";

import { Location } from "@/balances/entities";
import {
  Payment,
  PaymentCapture,
  PaymentTransaction,
  Transaction as TransactionEntity,
} from "@/payments/entities";

import { TransactionIcon } from "./TransactionIcon";
import {
  formatBlockchainAddress,
  formatBlockchainName,
  formatName,
  formatTransactionStatus,
} from "./formatting";

type TransactionProps = {
  transactions: TransactionEntity[];
  locations: Location[];
  payment?: Payment;
  capture?: PaymentCapture;
};

export const Transaction: FC<TransactionProps> = ({
  transactions,
  locations,
  payment,
  capture,
}: TransactionProps) => {
  const paymentTransaction: PaymentTransaction = transactions.find(
    (t) => t.type === "payment"
  )!;
  const feeTransactions = transactions.filter(
    (transaction) => transaction.type === "fee"
  );

  const paymentLocation = locations.find(
    (location) => location.id === paymentTransaction.location
  )!;

  const name = formatName({ transaction: paymentTransaction!, payment });

  const metadata: Record<string, string> =
    Object.keys(payment?.metadata || {}).length > 0
      ? payment?.metadata!
      : Object.keys(capture?.metadata || {}).length > 0
      ? capture?.metadata!
      : {};

  return (
    <div className="transaction-details">
      <div className="transaction-box">
        <TransactionIcon type={payment ? "payment" : "raw"} />
        <h1>
          {paymentTransaction?.amount} {paymentTransaction?.currency}
        </h1>
        <span className="transaction-name">{name}</span>
      </div>

      <div className="transaction-box-narrow">
        <h3>Transaction</h3>

        <div className="transaction-box-list">
          <div className="item">
            <div className="label">Date</div>
            <div className="value">
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(paymentTransaction?.created_at!))}
            </div>
          </div>

          {payment && (
            <div className="item">
              <div className="label">Payment Method</div>
              <div className="value">
                {payment.method === "crypto" ? "Crypto" : "Arc Pay"}
              </div>
            </div>
          )}

          <div className="item">
            <div className="label">Payment Network</div>
            <div className="value">
              {paymentTransaction.network === "blockchain"
                ? "Blockchain"
                : paymentTransaction.network}
            </div>
          </div>

          <div className="item">
            <div className="label">Paid from</div>
            <div className="value">
              {paymentLocation.type === "crypto_wallet"
                ? "Crypto Wallet"
                : "Balance"}
            </div>
          </div>

          <div className="item">
            <div className="label">Blockchain</div>
            <div className="value">
              {formatBlockchainName(paymentLocation.blockchain)}
            </div>
          </div>

          {paymentTransaction.blockchain.hash && (
            <div className="item">
              <div className="label">Blockchain Transaction</div>
              <div className="value">
                {paymentTransaction.blockchain.explorer_url ? (
                  <a
                    href={paymentTransaction.blockchain.explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {formatBlockchainAddress(
                      paymentTransaction.blockchain.hash,
                      true
                    )}
                  </a>
                ) : (
                  <span>
                    {formatBlockchainAddress(
                      paymentTransaction.blockchain.hash,
                      true
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {paymentTransaction.blockchain.counterparty && (
            <div className="item">
              <div className="label">Counterparty</div>
              <div
                className="value"
                title={paymentTransaction.blockchain.counterparty}
              >
                {formatBlockchainAddress(
                  paymentTransaction.blockchain.counterparty
                )}
              </div>
            </div>
          )}

          <div className="item">
            <div className="label">Status</div>
            <div className="value">
              {formatTransactionStatus(paymentTransaction.status)}
            </div>
          </div>

          {payment && (
            <div className="item">
              <div className="label">Authorization</div>
              <div className="value">
                {payment.authorization.method === "mandate"
                  ? "Pre-authorization"
                  : "User"}
              </div>
            </div>
          )}

          {payment && (
            <div className="item">
              <div className="label">Triggered</div>
              <div className="value">
                {payment.trigger.method === "user"
                  ? "Manually"
                  : "Counterparty charge"}
              </div>
            </div>
          )}
        </div>

        {feeTransactions.length > 0 && (
          <>
            <h3>Fees</h3>

            <div className="transaction-box-list">
              {feeTransactions.map((feeTransaction) => (
                <div className="item">
                  <div className="label">
                    {feeTransaction.fee_type === "network"
                      ? "Network Fee"
                      : "Fee"}
                  </div>
                  <div className="value">
                    {feeTransaction.amount} {feeTransaction.currency}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {Object.keys(metadata).length > 0 && (
          <>
            <h3>Metadata</h3>

            <div className="transaction-box-list">
              {Object.keys(metadata).map((key) => (
                <div className="item">
                  <div className="label">{key}</div>
                  <div className="value">{metadata[key]}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
