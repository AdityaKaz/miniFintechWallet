import axios from "axios";
import { API_BASE_URL } from "../config/constants";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Users
export const fetchUsers = () => client.get("/users").then((r) => r.data);

// Transactions
export const fetchTransactions = () =>
  client.get("/transactions").then((r) => r.data.filter((tx) => !tx.deleted));

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

// Helper to compute balance client-side if needed
export const deriveBalance = (transactions) => {
  return transactions.reduce((acc, tx) => {
    if (tx.type === "credit") return acc + tx.amount;
    if (tx.type === "debit" || tx.type === "fee") return acc - tx.amount;
    return acc;
  }, 0);
};
