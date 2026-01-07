import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import TransactionList from "./components/TransactionList";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-linear-to-b from-gray-950 via-gray-900 to-gray-900 text-gray-100">
        <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">
                Wallet
              </p>
              <h1 className="text-3xl font-bold text-white">
                Mini Fintech Wallet
              </h1>
              <p className="text-base text-gray-400 mt-1">
                Balance, transfers, and history in one view.
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
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/history" element={<TransactionList />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
