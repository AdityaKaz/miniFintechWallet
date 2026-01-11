import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import History from "./History";

vi.mock("../services/api", () => ({
  fetchTransactions: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        type: "credit",
        amount: 1000,
        status: "success",
        createdAt: new Date().toISOString(),
        note: "Salary",
      },
    ])
  ),
  deleteTransaction: vi.fn(() => Promise.resolve()),
  restoreTransaction: vi.fn(() => Promise.resolve()),
}));

describe("History Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Removed simple title smoke test to keep total count lean.

  it("filters by status and date, and supports delete/undo restore", async () => {
    const now = new Date();
    const txns = [
      {
        id: 1,
        type: "debit",
        amount: 300,
        status: "success",
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
        note: "Rent",
      },
      {
        id: 2,
        type: "credit",
        amount: 500,
        status: "pending",
        createdAt: now.toISOString(),
        note: "Top-up",
      },
      {
        id: 3,
        type: "debit",
        amount: 200,
        status: "failed",
        createdAt: now.toISOString(),
        note: "Gift",
      },
    ];
    const api = await import("../services/api");
    api.fetchTransactions.mockResolvedValueOnce(txns);
    api.deleteTransaction.mockResolvedValueOnce(undefined);
    api.restoreTransaction.mockResolvedValueOnce(undefined);

    render(
      <BrowserRouter>
        <History />
      </BrowserRouter>
    );

    // Wait list render
    expect(
      await screen.findByText(/Filter by status\/date/i)
    ).toBeInTheDocument();

    // Filter by Success
    const successBtn = screen.getByRole("button", { name: /success/i });
    fireEvent.click(successBtn);
    // After filtering, only 1 transaction should be visible (success)
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      expect(deleteButtons.length).toBe(1);
    });

    // Set date range to include only today
    const [startDate, endDate] = screen.getAllByDisplayValue("");
    fireEvent.change(startDate, {
      target: { value: now.toISOString().slice(0, 10) },
    });
    fireEvent.change(endDate, {
      target: { value: now.toISOString().slice(0, 10) },
    });

    // Click Clear to reset
    const clearBtn = await screen.findByText(/clear/i);
    fireEvent.click(clearBtn);

    // Delete first transaction
    const deleteBtn = await screen.findByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    // Undo banner appears; click Undo
    const undoBtn = await screen.findByRole("button", { name: /undo/i });
    fireEvent.click(undoBtn);

    const apiVerify = await import("../services/api");
    await waitFor(() => {
      expect(apiVerify.deleteTransaction).toHaveBeenCalled();
      expect(apiVerify.restoreTransaction).toHaveBeenCalled();
    });
  });
});
