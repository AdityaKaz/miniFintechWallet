import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  deleteTransaction,
  fetchTransactions,
  restoreTransaction,
} from "../services/api";
import { CURRENT_USER_ID } from "../config/constants";
import TransactionList from "../components/common/TransactionList";

const History = ({ refreshTrigger = 0, isReconciling = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, success, pending, failed
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
      const msg = "Failed to load transaction history. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tx) => {
    try {
      setLoading(true);
      await deleteTransaction(tx.id);
      setLastDeleted(tx);
      if (undoTimerId) {
        clearTimeout(undoTimerId);
      }
      const id = setTimeout(() => setLastDeleted(null), 6000);
      setUndoTimerId(id);
      toast.success("Transaction deleted. You have 6 seconds to undo.");
      await loadTransactions();
    } catch (err) {
      console.error("Failed to delete transaction", err);
      const msg = "Could not delete transaction. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    // Filter out fee transactions (shown inline with debits)
    if (tx.type === "fee") return false;

    const matchesStatus = filter === "all" ? true : tx.status === filter;

    const txDate = new Date(tx.createdAt);
    const afterStart = startDate ? txDate >= new Date(startDate) : true;
    const beforeEnd = endDate
      ? txDate <= new Date(`${endDate}T23:59:59.999Z`)
      : true;

    return matchesStatus && afterStart && beforeEnd;
  });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, startDate, endDate]);

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
      toast.success("Transaction restored.");
      await loadTransactions();
    } catch (err) {
      console.error("Failed to restore transaction", err);
      const msg = "Could not undo delete. Please try again.";
      setError(msg);
      toast.error(msg);
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
            onClick={() => {
              setError(null);
              loadTransactions();
            }}
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
          transactions={paginatedTransactions}
          loading={loading}
          showDelete
          onDelete={handleDelete}
        />
      </div>

      {/* Pagination Controls */}
      {filteredTransactions.length > itemsPerPage && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            Showing {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, filteredTransactions.length)}{" "}
            of {filteredTransactions.length} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {lastDeleted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-between rounded-lg border border-indigo-500/40 bg-indigo-900/95 backdrop-blur-sm px-4 py-3 text-sm text-indigo-100 shadow-xl shadow-black/50">
            <div>
              Deleted {lastDeleted.type === "credit" ? "credit" : "debit"} of ₹
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
        </div>
      )}
    </div>
  );
};

export default History;
