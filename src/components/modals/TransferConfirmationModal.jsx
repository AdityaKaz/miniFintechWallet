const TransferConfirmationModal = ({
  open,
  amount,
  fee,
  total,
  recipientName,
  note,
  onCancel,
  onConfirm,
  loading,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 shadow-2xl shadow-black/50 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300 font-medium">
              Confirm Transfer
            </p>
            <h3 className="text-2xl font-semibold text-white mt-1 tabular-nums">
              ₹{" "}
              {amount?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
            <p className="text-sm text-gray-300 mt-1">To {recipientName}</p>
            {note ? (
              <p className="text-xs text-gray-400 mt-1">Note: {note}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-200">
          <div className="flex justify-between">
            <span>Amount</span>
            <span className="tabular-nums">₹ {amount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Fee</span>
            <span className="tabular-nums">
              ₹ {fee?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-white pt-2 border-t border-gray-800">
            <span>Total</span>
            <span className="tabular-nums">
              ₹ {total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 text-sm font-medium">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferConfirmationModal;
