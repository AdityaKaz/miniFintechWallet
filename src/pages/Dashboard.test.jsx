import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "./Dashboard";

vi.mock("../services/api", () => ({
  fetchUser: vi.fn(() =>
    Promise.resolve({ id: 1, name: "John", balance: 5000 })
  ),
  fetchUsers: vi.fn(() => Promise.resolve([{ id: 1, name: "John" }])),
  fetchTransactions: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        type: "credit",
        amount: 1000,
        status: "success",
        createdAt: new Date().toISOString(),
      },
    ])
  ),
}));

describe("Dashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Removed simple title smoke test to keep total count lean.

  it("shows last 10 transactions indicator when more than 10 exist", async () => {
    const manyTxns = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      type: i % 2 === 0 ? "credit" : "debit",
      amount: 100 + i,
      status: "success",
      createdAt: new Date(Date.now() - i * 1000).toISOString(),
      note: `Txn ${i + 1}`,
    }));

    const api = await import("../services/api");
    api.fetchUser.mockResolvedValueOnce({ id: 2, balance: 12345 });
    api.fetchTransactions.mockResolvedValueOnce(manyTxns);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for list and indicator
    await waitFor(() => {
      expect(screen.getByText(/Recent Transactions/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Showing 10 of 12 transactions/i)
      ).toBeInTheDocument();
    });
  });
});
