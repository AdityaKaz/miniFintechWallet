import { useState, useEffect } from "react";
import {
  deleteTransaction,
  fetchTransactions,
  restoreTransaction,
} from "../services/api";
import { CURRENT_USER_ID } from "../config/constants";
import TransactionList from "./TransactionList";

const History = ({ refreshTrigger = 0, isReconciling = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, success, pending, failed
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lastDeleted, setLastDeleted] = useState(null);
  const [undoTimerId, setUndoTimerId] = useState(null);

  // Initial load - wait for reconciliation to complete
  useEffect(() => {
    if (!isReconciling) {
      loadTransactions();
    }
  }, [isReconciling]);

  // Refresh after reconciliation
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadTransactions();
    }
  }, [refreshTrigger]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions(CURRENT_USER_ID);
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setTransactions(sorted);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError("Failed to load transaction history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tx) => {
    const confirmed = window.confirm(
      `Delete this transaction?\n\nAmount: ${tx.type === "credit" ? "+" : "-"}${
        tx.amount
      }\nNote: ${tx.note || "(no note)"}`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteTransaction(tx.id);
      setLastDeleted(tx);
      if (undoTimerId) {
        clearTimeout(undoTimerId);
      }
      const id = setTimeout(() => setLastDeleted(null), 6000);
      setUndoTimerId(id);
      await loadTransactions();
    } catch (err) {
      console.error("Failed to delete transaction", err);
      setError("Could not delete transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = filter === "all" ? true : tx.status === filter;

    const txDate = new Date(tx.createdAt);
    const afterStart = startDate ? txDate >= new Date(startDate) : true;
    const beforeEnd = endDate
      ? txDate <= new Date(`${endDate}T23:59:59.999Z`)
      : true;

    return matchesStatus && afterStart && beforeEnd;
  });

  const handleUndo = async () => {
    if (!lastDeleted) return;
    try {
      setLoading(true);
      if (undoTimerId) {
        clearTimeout(undoTimerId);
        setUndoTimerId(null);
      }
      await restoreTransaction(lastDeleted.id);
      setLastDeleted(null);
      await loadTransactions();
    } catch (err) {
      console.error("Failed to restore transaction", err);
      setError("Could not undo delete. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-red-900/20 border border-red-700 p-4">
          <p className="text-red-100 text-sm">{error}</p>
          <button
            onClick={loadTransactions}
            className="mt-3 px-3 py-2 bg-red-700 text-white rounded text-sm hover:bg-red-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Transaction History
          </h2>
          <p className="text-gray-300 mt-1 text-[15px]">
            Filter by status/date and review recent activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[13px] text-gray-300">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full border transition-colors ${
              filter === "all"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-gray-800 border-gray-700 hover:bg-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("success")}
            className={`px-3 py-1 rounded-full border transition-colors ${
              filter === "success"
                ? "bg-green-600 text-white border-green-600"
                : "bg-gray-800 border-gray-700 hover:bg-gray-700"
            }`}
          >
            Success
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded-full border transition-colors ${
              filter === "pending"
                ? "bg-yellow-600 text-white border-yellow-600"
                : "bg-gray-800 border-gray-700 hover:bg-gray-700"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("failed")}
            className={`px-3 py-1 rounded-full border transition-colors ${
              filter === "failed"
                ? "bg-red-600 text-white border-red-600"
                : "bg-gray-800 border-gray-700 hover:bg-gray-700"
            }`}
          >
            Failed
          </button>
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1"
            />
            <span className="text-gray-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-2 py-1"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-gray-300 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-850 p-5 shadow-inner shadow-black/20">
        <TransactionList
          transactions={filteredTransactions}
          loading={loading}
          showDelete
          onDelete={handleDelete}
        />
      </div>

      {lastDeleted && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-500/40 bg-indigo-900/30 px-4 py-3 text-sm text-indigo-100">
          <div>
            Deleted {lastDeleted.type === "credit" ? "credit" : "debit"} of $
            {lastDeleted.amount}
            {lastDeleted.note ? ` · ${lastDeleted.note}` : ""}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              className="rounded-md bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-400"
            >
              Undo
            </button>
            <button
              onClick={() => {
                if (undoTimerId) {
                  clearTimeout(undoTimerId);
                  setUndoTimerId(null);
                }
                setLastDeleted(null);
              }}
              className="text-xs text-indigo-200 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
