import { useState } from "react";
import {
  createTransaction,
  fetchUser,
  updateUserBalance,
} from "../../services/api";
import { TRANSFER_LIMIT, CURRENT_USER_ID } from "../../config/constants";
import { validateAddMoneyAmount } from "../../utils/validation";

const AddMoneyForm = ({ userId = CURRENT_USER_ID, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const numericAmount = Number(amount);

    const baseValidation = validateAddMoneyAmount(numericAmount);
    if (!baseValidation.isValid) {
      setError(baseValidation.message);
      return;
    }

    if (numericAmount > TRANSFER_LIMIT) {
      setError(
        `Amount exceeds maximum limit of ₹${TRANSFER_LIMIT.toLocaleString()}`
      );
      return;
    }

    try {
      setLoading(true);

      // Fetch current user balance
      const user = await fetchUser(userId);

      // Create credit transaction
      const payload = {
        type: "credit",
        amount: numericAmount,
        userId,
        status: "success",
        note: note?.trim() || "Top-up",
        createdAt: new Date().toISOString(),
      };
      await createTransaction(payload);

      // Update user balance
      const newBalance = user.balance + numericAmount;
      await updateUserBalance(userId, newBalance);

      setAmount("");
      setNote("");
      if (typeof onSuccess === "function") onSuccess();
      alert("Money added successfully!");
    } catch (err) {
      console.error("Add money failed", err);
      setError("Could not add money. Please try again.");
      alert("Failed to add money.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
            Max ₹{TRANSFER_LIMIT.toLocaleString()} per transaction
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-300 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            maxLength={200}
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            placeholder="e.g., Salary top-up"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded font-medium"
        >
          {loading ? "Adding..." : "Add Money"}
        </button>
      </div>
    </form>
  );
};

export default AddMoneyForm;
