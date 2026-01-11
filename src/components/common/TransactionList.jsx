const TransactionList = ({
  transactions,
  loading,
  onDelete,
  showDelete,
  limit,
}) => {
  // Filter out fee transactions (they'll be shown inline with debits)
  const visibleTransactions = transactions.filter((tx) => tx.type !== "fee");

  // Create a map of transaction ID to fee amount for quick lookup
  const feeMap = transactions.reduce((acc, tx) => {
    if (tx.type === "fee" && tx.linkedTransactionId) {
      acc[tx.linkedTransactionId] = tx.amount;
    }
    return acc;
  }, {});

  // For refund transactions, extract fee from note if present
  const getRefundFee = (tx) => {
    if (
      tx.type === "credit" &&
      tx.note &&
      tx.note.startsWith("Refund: Transfer failed") &&
      tx.linkedTransactionId
    ) {
      // Find the original debit and its fee
      const origDebit = transactions.find(
        (t) => t.id === tx.linkedTransactionId && t.type === "debit"
      );
      const origFee = feeMap[tx.linkedTransactionId];
      if (origFee && origDebit) {
        return origFee;
      }
    }
    return null;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} · ${timeStr}`;
  };

  const getTransactionLabel = (tx) => {
    if (tx.type === "credit") return "Added Money";
    if (tx.type === "debit") return `Transfer to ${tx.toUserId}`;
    return tx.type;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-900/30 text-green-200 border-green-700";
      case "failed":
        return "bg-red-900/30 text-red-200 border-red-700";
      case "pending":
        return "bg-yellow-900/30 text-yellow-200 border-yellow-700";
      default:
        return "bg-gray-700 text-gray-200";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "credit":
        return "text-green-400";
      case "debit":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (visibleTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-[15px]">No transactions yet</p>
        <p className="text-gray-500 text-sm mt-1">Add money to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {(limit ? visibleTransactions.slice(0, limit) : visibleTransactions).map(
        (tx) => {
          const fee = feeMap[tx.id] || getRefundFee(tx);

          // For refund transactions, don't add fee to amount (already included)
          const isRefund =
            tx.type === "credit" &&
            tx.note &&
            tx.note.startsWith("Refund: Transfer failed") &&
            tx.linkedTransactionId;

          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/40 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  <p className="text-white font-semibold text-base">
                    {getTransactionLabel(tx)}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {formatDate(tx.createdAt)}
                  </p>
                  {tx.note && (
                    <p className="text-gray-500 text-xs mt-1 italic">
                      "{tx.note}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p
                    className={`font-bold text-lg tabular-nums ${getTypeColor(
                      tx.type
                    )}`}
                  >
                    {tx.type === "credit" ? "+" : "-"}
                    {isRefund
                      ? formatCurrency(tx.amount)
                      : fee
                      ? formatCurrency(tx.amount + fee)
                      : formatCurrency(tx.amount)}
                  </p>
                  {fee && (
                    <p className="text-xs text-gray-400 font-normal mt-1">
                      ({formatCurrency(fee)} fee)
                    </p>
                  )}
                  <span
                    className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border mt-1.5 ${getStatusColor(
                      tx.status
                    )}`}
                  >
                    {tx.status}
                  </span>
                </div>

                {showDelete && typeof onDelete === "function" && (
                  <button
                    onClick={() => onDelete(tx)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
                    title="Delete transaction"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        }
      )}
      {limit && visibleTransactions.length > limit && (
        <p className="text-gray-400 text-sm text-center mt-4 py-2">
          Showing {limit} of {visibleTransactions.length} transactions
        </p>
      )}
    </div>
  );
};

export default TransactionList;
