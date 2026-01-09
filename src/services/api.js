import axios from "axios";
import { API_BASE_URL } from "../config/constants";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

// Users
export const fetchUsers = () => client.get("/users").then((r) => r.data);

export const fetchUser = (userId) =>
  client.get(`/users/${userId}`).then((r) => r.data);

export const updateUserBalance = (userId, newBalance) =>
  client.patch(`/users/${userId}`, { balance: newBalance }).then((r) => r.data);

// Single transaction fetch
export const fetchTransaction = (id) =>
  client.get(`/transactions/${id}`).then((r) => r.data);

// Transactions
export const fetchTransactions = (userId) =>
  client
    .get("/transactions")
    .then((r) => r.data.filter((tx) => !tx.deleted && tx.userId === userId));

export const createTransaction = (payload) =>
  client.post("/transactions", payload).then((r) => r.data);

export const updateTransactionStatus = (id, status, note) =>
  client.patch(`/transactions/${id}`, { status, note }).then((r) => r.data);

export const deleteTransaction = (id) =>
  client
    .patch(`/transactions/${id}`, {
      deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .then((r) => r.data);

// Restore a soft-deleted transaction
export const restoreTransaction = (id) =>
  client
    .patch(`/transactions/${id}`, { deleted: false, deletedAt: null })
    .then((r) => r.data);

// Retry a pending/incomplete debit transfer: idempotently finish crediting recipient and marking success
export const retryPendingTransfer = async (debitId) => {
  const debit = await fetchTransaction(debitId);
  if (!debit || debit.type !== "debit") {
    throw new Error("Retry supported only for debit transactions");
  }
  if (debit.status === "failed") {
    return { debit, skipped: true, reason: "already failed" };
  }

  // Find linked fee and any existing credit
  // ⚠️ json-server query params are unreliable, so fetch all and filter client-side
  const allTxns = await client.get("/transactions").then((r) => r.data || []);
  const linkedTxns = allTxns.filter((tx) => tx.linkedTransactionId === debitId);

  console.log(
    `🔍 Checking debit ${debitId} - Found ${linkedTxns.length} linked transactions:`,
    linkedTxns.map((t) => `${t.type} (${t.id})`)
  );

  const feeTx = linkedTxns.find((tx) => tx.type === "fee");
  const existingCredit = linkedTxns.find((tx) => tx.type === "credit");

  if (existingCredit) {
    console.log(
      `⚠️ Found existing credit: ID ${existingCredit.id}, amount: ₹${existingCredit.amount}`
    );
  }

  const sender = await fetchUser(debit.userId);
  const recipient = await fetchUser(debit.toUserId);

  // If credit already exists, just mark statuses; otherwise create credit and apply balance
  if (!existingCredit) {
    console.log(
      `🔵 Creating credit for debit ${debitId}: ₹${debit.amount} to user ${recipient.id}`
    );
    const creditResult = await createTransaction({
      type: "credit",
      amount: debit.amount,
      userId: recipient.id,
      fromUserId: sender.id,
      status: "success",
      note: `Received from ${sender.name || "User"}`,
      linkedTransactionId: debit.id,
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Credit created with ID: ${creditResult.id}`);

    const newBalance = recipient.balance + debit.amount;
    console.log(
      `🔵 Updating balance for user ${recipient.id}: ${recipient.balance} → ${newBalance}`
    );
    await updateUserBalance(recipient.id, newBalance);
    console.log(`✅ Balance updated`);
  } else {
    console.log(
      `⚠️ Credit already exists for debit ${debitId}, skipping creation`
    );
  }

  // Ensure recipient balance is reconciled in case credit exists but balance was never applied
  const recipientTxns = await fetchTransactions(recipient.id);
  const derivedRecipientBalance = deriveBalance(recipientTxns);
  if (recipient.balance !== derivedRecipientBalance) {
    await updateUserBalance(recipient.id, derivedRecipientBalance);
  }

  await Promise.all([
    updateTransactionStatus(debit.id, "success"),
    feeTx?.id
      ? updateTransactionStatus(feeTx.id, "success")
      : Promise.resolve(),
  ]);

  return { debitId, status: "success" };
};

// Delay helper for batching
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reconcile PENDING debits + SUCCESS debits missing credits in batches (on app startup)
// Handles both stuck pendings and orphaned success debits (where credit creation failed)
// Idempotent: safe to rerun, won't double-credit
export const reconcileAllPendingTransfers = async () => {
  const allTxns = await client.get("/transactions").then((r) => r.data || []);

  // Find PENDING debits OR SUCCESS debits without a corresponding credit
  const incompleteDebits = allTxns.filter((tx) => {
    if (tx.type !== "debit" || tx.status === "failed") return false;

    // Include if pending
    if (tx.status === "pending") return true;

    // Include if success but missing credit
    const hasCredit = allTxns.some(
      (t) => t.type === "credit" && t.linkedTransactionId === tx.id
    );
    return tx.status === "success" && !hasCredit;
  });

  if (incompleteDebits.length === 0) {
    return { fixed: [], count: 0 };
  }

  const fixed = [];
  const batchDelay = 50; // small pause between items to reduce write contention

  // Process sequentially to avoid race conditions on balances
  for (const debit of incompleteDebits) {
    try {
      await retryPendingTransfer(debit.id);
      fixed.push(debit.id);
    } catch (err) {
      console.error(`Failed to reconcile debit ${debit.id}:`, err);
    }

    // Brief delay to avoid hammering json-server
    await delay(batchDelay);
  }

  // After reconciliation, recalculate and sync all user balances
  // This ensures stored balance matches transaction ledger (especially after pending→success)
  if (fixed.length > 0) {
    console.log("🔄 Syncing balances after reconciliation...");
    try {
      const users = await fetchUsers();
      const updatedTxns = await client
        .get("/transactions")
        .then((r) => r.data || []);

      for (const user of users) {
        const userTxns = updatedTxns.filter(
          (tx) => !tx.deleted && tx.userId === user.id
        );
        const derivedBalance = deriveBalance(userTxns);

        if (user.balance !== derivedBalance) {
          console.log(
            `📊 User ${user.id}: stored ${user.balance} → derived ${derivedBalance}`
          );
          await updateUserBalance(user.id, derivedBalance);
        }
      }
      console.log("✅ Balance sync complete");
    } catch (err) {
      console.error("Balance sync failed:", err);
    }
  }

  return { fixed, count: fixed.length };
};

// Helper to compute balance from transactions (for validation & audit)
export const deriveBalance = (transactions) => {
  return transactions.reduce((acc, tx) => {
    if (tx.deleted) return acc;
    // Only count success and pending transactions (exclude failed)
    if (tx.status !== "success" && tx.status !== "pending") return acc;

    if (tx.type === "credit") return acc + tx.amount;
    if (tx.type === "debit" || tx.type === "fee") return acc - tx.amount;
    return acc;
  }, 0);
};

// Validate balance consistency: stored balance should match computed balance
export const validateBalance = async (userId, transactions) => {
  const user = await fetchUser(userId);
  const computed = deriveBalance(transactions);
  return {
    stored: user.balance,
    computed,
    isConsistent: user.balance === computed,
  };
};
