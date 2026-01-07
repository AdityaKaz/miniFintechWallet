const Dashboard = () => {
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
          <h3 className="text-4xl font-semibold text-white mt-2 tabular-nums">
            ₹ --,--
          </h3>
          <p className="text-gray-400 text-[15px] mt-1">
            Live balance will appear here.
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
            <div className="hidden sm:flex gap-2">
              <span className="px-3 py-2 rounded-lg bg-gray-800 text-gray-200 text-[13px] font-medium">
                Add Money
              </span>
              <span className="px-3 py-2 rounded-lg bg-gray-800 text-gray-200 text-[13px] font-medium">
                Transfer
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-850 p-5 shadow-inner shadow-black/20">
        <p className="text-[15px] text-gray-300">
          Recent activity will be summarized here.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
