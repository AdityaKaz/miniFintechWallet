const TransactionList = ({ transactions, loading, onDelete, showDelete }) => {
  // Filter out fee transactions (they'll be shown inline with debits)
  const visibleTransactions = transactions.filter((tx) => tx.type !== "fee");

  // Create a map of transaction ID to fee amount for quick lookup
  const feeMap = transactions.reduce((acc, tx) => {
    if (tx.type === "fee" && tx.linkedTransactionId) {
      acc[tx.linkedTransactionId] = tx.amount;
    }
    return acc;
  }, {});

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="space-y-2">
      {visibleTransactions.slice(0, 10).map((tx) => {
        const fee = feeMap[tx.id];

        return (
          <div
            key={tx.id}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/40 hover:bg-gray-800/60 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  {getTransactionLabel(tx)}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {formatDate(tx.createdAt)}
                </p>
                {tx.note && (
                  <p className="text-gray-500 text-xs mt-1">"{tx.note}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`font-semibold text-sm ${getTypeColor(tx.type)}`}>
                  {tx.type === "credit" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                  {fee && (
                    <span className="text-xs text-gray-400 font-normal ml-1">
                      ({formatCurrency(fee)} fee)
                    </span>
                  )}
                </p>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded border mt-1 ${getStatusColor(
                    tx.status
                  )}`}
                >
                  {tx.status}
                </span>
              </div>

              {showDelete && typeof onDelete === "function" && (
                <button
                  onClick={() => onDelete(tx)}
                  className="px-3 py-1 text-xs rounded border border-red-700 text-red-100 hover:bg-red-900/40 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
      {visibleTransactions.length > 10 && (
        <p className="text-gray-500 text-xs text-center mt-4">
          Showing 10 of {visibleTransactions.length} transactions
        </p>
      )}
    </div>
  );
};

export default TransactionList;
