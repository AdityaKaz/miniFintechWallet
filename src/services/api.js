import axios from "axios";
import { API_BASE_URL } from "../config/constants";

/* ===================== HTTP CLIENT ===================== */

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

/* ===================== USERS ===================== */

export const fetchUsers = () => client.get("/users").then((r) => r.data);

export const fetchUser = (userId) =>
  client.get(`/users/${userId}`).then((r) => r.data);

export const updateUserBalance = (userId, newBalance) =>
  client.patch(`/users/${userId}`, { balance: newBalance }).then((r) => r.data);

/* ===================== TRANSACTIONS ===================== */

export const fetchTransaction = (id) =>
  client.get(`/transactions/${id}`).then((r) => r.data);

export const fetchTransactions = async (userId) => {
  const res = await client.get("/transactions");
  return res.data.filter((tx) => !tx.deleted && tx.userId === userId);
};

export const createTransaction = (payload) =>
  client.post("/transactions", payload).then((r) => r.data);

export const updateTransactionStatus = (id, status, note) =>
  client.patch(`/transactions/${id}`, { status, note }).then((r) => r.data);

export const deleteTransaction = (id) =>
  client.patch(`/transactions/${id}`, {
    deleted: true,
    deletedAt: new Date().toISOString(),
  });

export const restoreTransaction = (id) =>
  client.patch(`/transactions/${id}`, {
    deleted: false,
    deletedAt: null,
  });

/* ===================== RETRY LOGIC ===================== */

export const retryPendingTransfer = async (debitId) => {
  const debit = await fetchTransaction(debitId);

  if (!debit || debit.type !== "debit") {
    throw new Error("Retry supported only for debit transactions");
  }

  if (debit.status === "failed") {
    return { skipped: true };
  }

  const allTxns = await client.get("/transactions").then((r) => r.data || []);
  const existingCredit = allTxns.find(
    (tx) => tx.type === "credit" && tx.linkedTransactionId === debitId
  );

  if (!existingCredit) {
    const recipient = await fetchUser(debit.toUserId);

    await createTransaction({
      type: "credit",
      amount: debit.amount,
      userId: recipient.id,
      status: "success",
      linkedTransactionId: debit.id,
      createdAt: new Date().toISOString(),
    });

    await updateUserBalance(recipient.id, recipient.balance + debit.amount);
  }

  await updateTransactionStatus(debit.id, "success");

  return { debitId, status: "success" };
};

/* ===================== RECONCILIATION ===================== */

export const reconcileAllPendingTransfers = async () => {
  const allTxns = await client.get("/transactions").then((r) => r.data || []);
  const now = Date.now();
  const fixed = [];

  for (const tx of allTxns) {
    if (tx.type === "debit" && tx.status === "pending") {
      const created = new Date(tx.createdAt).getTime();
      if (now - created > 24 * 60 * 60 * 1000) {
        // Mark as failed and refund
        await updateTransactionStatus(
          tx.id,
          "failed",
          "Failed: Timeout (>24h)"
        );

        // Find pending fee for this debit
        const feeTx = allTxns.find(
          (t) =>
            t.type === "fee" &&
            t.linkedTransactionId === tx.id &&
            t.status === "pending"
        );
        let totalRefund = tx.amount;
        if (feeTx) {
          await updateTransactionStatus(
            feeTx.id,
            "failed",
            "Failed: Timeout (>24h, fee)"
          );
          totalRefund += feeTx.amount;
        }

        const user = await fetchUser(tx.userId);

        await createTransaction({
          type: "credit",
          amount: totalRefund,
          userId: tx.userId,
          status: "success",
          linkedTransactionId: tx.id,
          createdAt: new Date().toISOString(),
          note: `Refund: Transfer failed (timeout, linked to ${tx.id})`,
        });

        await updateUserBalance(user.id, user.balance + totalRefund);
        fixed.push(tx.id);
      } else {
        // Mark as success if <24h old
        await updateTransactionStatus(
          tx.id,
          "success",
          "Auto-success: Server restart (<24h)"
        );

        // Mark linked fee as success if exists
        const feeTx = allTxns.find(
          (t) =>
            t.type === "fee" &&
            t.linkedTransactionId === tx.id &&
            t.status === "pending"
        );
        if (feeTx) {
          await updateTransactionStatus(
            feeTx.id,
            "success",
            "Auto-success: Server restart (<24h, fee)"
          );
        }

        // Create credit for recipient user if toUserId exists
        if (tx.toUserId) {
          const creditTxn = await createTransaction({
            type: "credit",
            amount: tx.amount,
            userId: tx.toUserId,
            fromUserId: tx.userId,
            status: "success",
            linkedTransactionId: tx.id,
            createdAt: new Date().toISOString(),
            note: `Received from User ${tx.userId}`,
          });
          // Update recipient's balance
          const recipient = await fetchUser(tx.toUserId);
          await updateUserBalance(recipient.id, recipient.balance + tx.amount);
        }

        fixed.push(tx.id);
      }
    }
  }

  return { fixed, count: fixed.length };
};

/* ===================== BALANCE ===================== */

export const deriveBalance = (transactions) =>
  transactions.reduce((acc, tx) => {
    if (tx.deleted) return acc;
    if (tx.status !== "success" && tx.status !== "pending") return acc;

    if (tx.type === "credit") return acc + tx.amount;
    if (tx.type === "debit" || tx.type === "fee") return acc - tx.amount;

    return acc;
  }, 0);

export const validateBalance = async (userId, transactions) => {
  const user = await fetchUser(userId);
  const computed = deriveBalance(transactions);

  return {
    stored: user.balance,
    computed,
    isConsistent: user.balance === computed,
  };
};
