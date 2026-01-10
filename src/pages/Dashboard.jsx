import { useState, useEffect } from "react";
import { fetchTransactions, fetchUser } from "../services/api";
import TransactionList from "../components/common/TransactionList";
import AddMoneyForm from "../components/forms/AddMoneyForm";
import TransferMoneyForm from "../components/forms/TransferMoneyForm";
import { CURRENT_USER_ID } from "../config/constants";

const Dashboard = ({ refreshTrigger = 0, isReconciling = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeForm, setActiveForm] = useState("add"); // "add" or "transfer"

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
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load wallet data. Please try again.");
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
            onClick={loadData}
            className="mt-3 px-3 py-2 bg-red-700 text-white rounded text-sm hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
          <p className="text-gray-300 mt-1 text-[15px]">
            Overview of your balance, quick actions, and recent movement.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-gray-400">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>All systems operational</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-linear-to-br from-gray-800 to-gray-850 p-5 shadow-lg shadow-black/30">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300 font-medium">
            Balance
          </p>
          {loading ? (
            <div className="mt-2 h-10 bg-gray-700 rounded animate-pulse" />
          ) : (
            <h3 className="text-4xl font-semibold text-white mt-2 tabular-nums">
              {formatCurrency(balance)}
            </h3>
          )}
          <p className="text-gray-400 text-[15px] mt-1">
            {loading ? "Loading..." : "Your current balance"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-850 p-5 shadow-lg shadow-black/30 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-300 font-medium">
                Quick Actions
              </p>
              <h3 className="text-xl font-semibold text-white mt-1">
                Add money or transfer
              </h3>
              <p className="text-gray-400 text-[15px] mt-1">
                Shortcuts to your primary flows.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Forms */}
      <div className="rounded-xl border border-gray-800 bg-gray-850 p-5">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveForm("add")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeForm === "add"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Add Money
          </button>
          <button
            onClick={() => setActiveForm("transfer")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeForm === "transfer"
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Transfer Money
          </button>
        </div>

        {activeForm === "add" ? (
          <AddMoneyForm userId={CURRENT_USER_ID} onSuccess={loadData} />
        ) : (
          <TransferMoneyForm userId={CURRENT_USER_ID} onSuccess={loadData} />
        )}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-gray-800 bg-gray-850 p-5 shadow-inner shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Recent Transactions
          </h3>
          <span className="text-xs text-gray-400">Last 10</span>
        </div>
        <TransactionList transactions={transactions} loading={loading} />
      </div>
    </div>
  );
};

export default Dashboard;
