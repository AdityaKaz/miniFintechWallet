const TransactionList = () => {
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
          <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
            All
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
            Success
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
            Pending
          </span>
          <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
            Failed
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-850 p-5 text-gray-300 shadow-inner shadow-black/20">
        <p className="text-[15px]">
          No transactions yet. When wired, this will list your latest activity.
        </p>
      </div>
    </div>
  );
};

export default TransactionList;
