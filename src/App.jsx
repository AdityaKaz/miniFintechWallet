import { useEffect, useRef, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { fetchUser, reconcileAllPendingTransfers } from "./services/api";
import { CURRENT_USER_ID } from "./config/constants";

function App() {
  const [userName, setUserName] = useState("");
  const [userLoadError, setUserLoadError] = useState(null);
  const [reconciling, setReconciling] = useState(true);
  const [reconcileError, setReconcileError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const reconcileOnceRef = useRef(false);

  // Load current user
  useEffect(() => {
    let active = true;

    fetchUser(CURRENT_USER_ID)
      .then((user) => {
        if (!active) return;
        setUserName(user?.name || "Wallet user");
        setUserLoadError(null);
      })
      .catch((err) => {
        console.error("Failed to load user", err);
        if (!active) return;
        setUserLoadError("User unavailable");
        setUserName("Wallet user");
      });

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  // Reconcile pending transfers on app startup (only once)
  useEffect(() => {
    if (reconcileOnceRef.current) return;
    reconcileOnceRef.current = true;

    const runReconciliation = async () => {
      try {
        setReconciling(true);
        setReconcileError(null);

        const result = await reconcileAllPendingTransfers();
        console.log(
          `✅ Reconciliation complete: ${result.count} transfers fixed`
        );

        // Allow json-server time to commit writes
        if (result.count > 0) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        setReconciling(false);
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        console.error("Reconciliation failed:", err);
        setReconcileError(
          "Failed to reconcile transfers. Some data may be stale."
        );
        setReconciling(false);
      }
    };

    runReconciliation();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-linear-to-b from-gray-950 via-gray-900 to-gray-900 text-gray-100">
        <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Mini Fintech Wallet
              </h1>

              {/* User identity / load status */}
              <p className="text-sm text-gray-400 mt-1">
                {userLoadError
                  ? userLoadError
                  : userName
                  ? `Welcome, ${userName}`
                  : "Loading user..."}
              </p>
            </div>

            <nav className="flex gap-2 text-[15px] font-medium">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-700 text-white shadow-sm shadow-indigo-900"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/history"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`
                }
              >
                History
              </NavLink>
            </nav>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
            {reconciling && (
              <div className="rounded-lg bg-indigo-900/30 border border-indigo-700 p-6 mb-6 text-center">
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-400 border-t-indigo-600 mb-3"></div>
                </div>
                <p className="text-indigo-200 text-sm">
                  Reconciling transfers... Please wait.
                </p>
              </div>
            )}

            {reconcileError && (
              <div className="rounded-lg bg-yellow-900/30 border border-yellow-700 p-4 mb-6">
                <p className="text-yellow-200 text-sm">{reconcileError}</p>
              </div>
            )}

            <ErrorBoundary>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      refreshTrigger={refreshTrigger}
                      isReconciling={reconciling}
                      userName={userName}
                    />
                  }
                />
                <Route
                  path="/history"
                  element={
                    <History
                      refreshTrigger={refreshTrigger}
                      isReconciling={reconciling}
                    />
                  }
                />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
