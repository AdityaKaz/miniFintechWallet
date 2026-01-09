import { useEffect, useMemo, useState } from "react";
import {
  createTransaction,
  fetchUser,
  fetchUsers,
  updateTransactionStatus,
  updateUserBalance,
} from "../services/api";
import {
  collectValidationErrors,
  validateNote,
  validateRecipient,
  validateTransferAmount,
} from "../utils/validation";
import {
  CURRENT_USER_ID,
  FEE_PERCENT,
  TRANSFER_LIMIT,
} from "../config/constants";
import TransferConfirmationModal from "./TransferConfirmationModal";

const TransferMoneyForm = ({ userId = CURRENT_USER_ID, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSummary, setPendingSummary] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const recipientOptions = useMemo(
    () => users.filter((u) => String(u.id) !== String(userId)),
    [users, userId]
  );

  const numericAmount = Number(amount) || 0;
  const fee = useMemo(() => numericAmount * FEE_PERCENT, [numericAmount]);
  const total = useMemo(() => numericAmount + fee, [numericAmount, fee]);

  const recipientName = useMemo(() => {
    const rec = recipientOptions.find(
      (u) => String(u.id) === String(recipientId)
    );
    return rec?.name || "Selected recipient";
  }, [recipientId, recipientOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validations = [
      validateTransferAmount(numericAmount),
      validateRecipient(recipientId, userId, users),
      validateNote(note),
    ];

    const results = collectValidationErrors(validations);
    if (!results.isValid) {
      setError(results.errors.join(". "));
      return;
    }

    try {
      const user = await fetchUser(userId);
      if (user.balance < total) {
        setError(
          `Insufficient balance. You have ₹${user.balance.toLocaleString()}, need ₹${total.toLocaleString()} (incl. fee).`
        );
        return;
      }

      setPendingSummary({
        amount: numericAmount,
        fee,
        total,
        recipientId,
        recipientName,
        note: note?.trim(),
      });
      setConfirmOpen(true);
    } catch (err) {
      console.error("Pre-transfer check failed", err);
      setError("Could not verify balance. Please try again.");
    }
  };

  const handleConfirm = async () => {
    if (!pendingSummary) return;
    const {
      amount: amt,
      fee: feeValue,
      total: totalValue,
      recipientId: recId,
      note: noteValue,
    } = pendingSummary;

    setLoading(true);
    setError(null);

    let debitTxn = null;
    let feeTxn = null;
    let balanceUpdated = false;
    let originalBalance = 0;

    try {
      // TESTING: 5-second delay to simulate a slow network request
      // Stop the server during this time to test incomplete transactions
      console.log(
        "🔵 Starting transfer in 5 seconds... Stop server now if testing interruption!"
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const user = await fetchUser(userId);
      originalBalance = user.balance;

      if (user.balance < totalValue) {
        setError(
          `Insufficient balance. You have ₹${user.balance.toLocaleString()}, need ₹${totalValue.toLocaleString()} (incl. fee).`
        );
        setConfirmOpen(false);
        setLoading(false);
        return;
      }

      const now = new Date().toISOString();

      // Step 1: Create debit txn (pending)
      debitTxn = await createTransaction({
        type: "debit",
        amount: amt,
        userId,
        toUserId: recId,
        status: "pending",
        note: noteValue || `Transfer to ${recipientName}`,
        createdAt: now,
      });

      // Step 2: Create fee txn (pending)
      feeTxn = await createTransaction({
        type: "fee",
        amount: feeValue,
        userId,
        status: "pending",
        note: "Transfer fee",
        linkedTransactionId: debitTxn.id,
        createdAt: now,
      });

      // Step 3: Update sender balance (deduct amount + fee)
      const newSenderBalance = user.balance - totalValue;
      await updateUserBalance(userId, newSenderBalance);
      balanceUpdated = true;

      // Step 4: Credit recipient and update their balance
      const recipient = await fetchUser(recId);
      await createTransaction({
        type: "credit",
        amount: amt,
        userId: recId,
        fromUserId: userId,
        status: "success",
        note: `Received from ${user.name || "User"}`,
        linkedTransactionId: debitTxn.id,
        createdAt: now,
      });

      const newRecipientBalance = recipient.balance + amt;
      await updateUserBalance(recId, newRecipientBalance);

      // Step 5: Mark sender txns success
      await Promise.all([
        updateTransactionStatus(debitTxn.id, "success"),
        updateTransactionStatus(feeTxn.id, "success"),
      ]);

      // All steps completed successfully - reset form and refresh UI
      setAmount("");
      setRecipientId("");
      setNote("");
      setPendingSummary(null);
      setConfirmOpen(false);
      alert("Transfer completed successfully.");
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      console.error("Transfer failed", err);

      // If balance was already updated, we need to refund
      if (balanceUpdated) {
        try {
          // Refund: restore balance
          await updateUserBalance(userId, originalBalance);

          // Create refund credit transaction for audit trail
          await createTransaction({
            type: "credit",
            amount: totalValue,
            userId,
            status: "success",
            note: `Refund: Transfer failed (linked to ${debitTxn?.id})`,
            linkedTransactionId: debitTxn?.id,
            createdAt: new Date().toISOString(),
          });

          setError(
            "Transfer failed after debit. Your balance has been refunded."
          );
        } catch (refundErr) {
          console.error("Refund failed", refundErr);
          setError(
            "Transfer failed and refund encountered an issue. Please contact support."
          );
        }
      } else {
        setError("Transfer failed. Your balance was not reduced.");
      }

      // Mark transactions as failed
      if (debitTxn?.id) {
        updateTransactionStatus(
          debitTxn.id,
          "failed",
          "Transfer failed - see refund"
        ).catch((e) => console.error("Failed to mark debit as failed", e));
      }
      if (feeTxn?.id) {
        updateTransactionStatus(
          feeTxn.id,
          "failed",
          "Transfer failed - see refund"
        ).catch((e) => console.error("Failed to mark fee as failed", e));
      }

      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-200 bg-red-900/30 border border-red-700 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-sm text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              min="1"
              step="1"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Max ₹{TRANSFER_LIMIT.toLocaleString()} per transfer
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-300 mb-1">
              Recipient
            </label>
            <select
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              disabled={loading || loadingUsers}
              required
            >
              <option value="">Select recipient</option>
              {recipientOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            maxLength={200}
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            placeholder="e.g., Rent, gift"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 flex justify-between">
          <span>Fee ({FEE_PERCENT * 100}%):</span>
          <span className="tabular-nums">
            ₹ {fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded font-medium"
          >
            {loading ? "Processing..." : "Transfer"}
          </button>
        </div>
      </form>

      <TransferConfirmationModal
        open={confirmOpen}
        amount={pendingSummary?.amount}
        fee={pendingSummary?.fee}
        total={pendingSummary?.total}
        recipientName={pendingSummary?.recipientName}
        note={pendingSummary?.note}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </div>
  );
};

export default TransferMoneyForm;
