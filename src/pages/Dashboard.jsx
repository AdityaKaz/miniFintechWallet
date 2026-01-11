import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { fetchTransactions, fetchUser } from "../services/api";
import TransactionList from "../components/common/TransactionList";
import AddMoneyForm from "../components/forms/AddMoneyForm";
import TransferMoneyForm from "../components/forms/TransferMoneyForm";
import { CURRENT_USER_ID } from "../config/constants";

const Dashboard = ({ refreshTrigger = 0, isReconciling = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeForm, setActiveForm] = useState(null); // null | "add" | "transfer"

  // Load data when reconciliation completes or when explicitly refreshed
  useEffect(() => {
    console.log(
      "📊 Dashboard effect triggered - isReconciling:",
      isReconciling,
      "refreshTrigger:",
      refreshTrigger
    );
    if (!isReconciling) {
      console.log("📊 Loading dashboard data...");
      loadData();
    }
  }, [isReconciling, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [user, txnData] = await Promise.all([
        fetchUser(CURRENT_USER_ID),
        fetchTransactions(CURRENT_USER_ID),
      ]);
      const sorted = [...txnData].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setTransactions(sorted);
      setBalance(user.balance);
      setUserName(user.name || "User");
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      const msg = "Failed to load wallet data. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-red-900/20 border border-red-700 p-4">
          <p className="text-red-100 text-sm">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="mt-3 px-3 py-2 bg-red-700 text-white rounded text-sm hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-semibold text-white">
          Welcome, {userName || "User"}
        </h2>
        <p className="text-gray-300 mt-1 text-[15px]">
          Overview of your balance, quick actions, and recent movement.
        </p>
      </div>

      {/* Card Grid: Balance + Action Buttons */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Balance Card - 40% */}
        <div className="relative lg:col-span-2 rounded-2xl border border-white/10 bg-linear-to-br from-indigo-950 via-slate-900 to-slate-900 p-6 shadow-lg shadow-black/30 overflow-hidden flex flex-col justify-center min-h-40">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300 font-medium">
            Balance
          </p>
          {loading ? (
            <div className="mt-4 h-14 bg-white/10 rounded animate-pulse" />
          ) : (
            <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mt-2 tabular-nums leading-tight">
              {formatCurrency(balance)}
            </h3>
          )}
        </div>

        {/* Quick Action Buttons - 60% */}
        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-gray-900 p-6">
          <h3 className="text-xs uppercase tracking-[0.2em] text-gray-300 font-medium mb-4">
            Quick Actions
          </h3>
          <div className="grid gap-3 grid-cols-2">
            <button
              aria-label="Add money"
              onClick={() => setActiveForm("add")}
              className="group flex flex-col items-center justify-center p-4 bg-linear-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl transition-all shadow-lg shadow-indigo-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 min-h-30"
            >
              <svg
                className="w-8 h-8 text-white mb-2 transition-transform group-hover:scale-105"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-white font-semibold text-lg">
                Add Money
              </span>
              <span className="text-indigo-200 text-xs mt-1">
                Top-up wallet
              </span>
            </button>

            <button
              aria-label="Transfer money"
              onClick={() => setActiveForm("transfer")}
              className="group flex flex-col items-center justify-center p-4 bg-linear-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl transition-all shadow-lg shadow-purple-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 min-h-30"
            >
              <svg
                className="w-8 h-8 text-white mb-2 transition-transform group-hover:scale-105"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <div className="text-center w-full">
                <span className="text-white font-semibold text-lg block">
                  Transfer
                </span>
                <span className="text-purple-200 text-xs mt-0.5 block">
                  Send to another user
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal/Slide-in Panel for Forms */}
      {activeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {activeForm === "add" ? "Add Money" : "Transfer Money"}
              </h3>
              <button
                onClick={() => setActiveForm(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {activeForm === "add" ? (
              <AddMoneyForm
                userId={CURRENT_USER_ID}
                onSuccess={() => {
                  loadData();
                  setActiveForm(null);
                }}
              />
            ) : (
              <TransferMoneyForm
                userId={CURRENT_USER_ID}
                onSuccess={() => {
                  loadData();
                  setActiveForm(null);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-inner shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Recent Transactions
          </h3>
          <span className="text-xs text-gray-400">Last 10</span>
        </div>
        <TransactionList
          transactions={transactions}
          loading={loading}
          limit={10}
        />
      </div>
    </div>
  );
};

export default Dashboard;
