import axios from "axios";
import { API_BASE_URL } from "../config/constants";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Users
export const fetchUsers = () => client.get("/users").then((r) => r.data);

export const fetchUser = (userId) =>
  client.get(`/users/${userId}`).then((r) => r.data);

export const updateUserBalance = (userId, newBalance) =>
  client.patch(`/users/${userId}`, { balance: newBalance }).then((r) => r.data);

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

// Helper to compute balance from transactions (for validation & audit)
export const deriveBalance = (transactions) => {
  return transactions.reduce((acc, tx) => {
    if (tx.deleted) return acc;
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
