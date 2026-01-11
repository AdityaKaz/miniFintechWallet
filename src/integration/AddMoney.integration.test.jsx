import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import AddMoneyForm from "../components/forms/AddMoneyForm";
import toast from "react-hot-toast";

// Mock toast notifications
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock API layer for integration-style flow
vi.mock("../services/api", () => ({
  fetchUser: vi.fn(() => Promise.resolve({ id: 1, balance: 5000 })),
  createTransaction: vi.fn(() => Promise.resolve({ id: 123 })),
  updateUserBalance: vi.fn(() => Promise.resolve({ id: 1, balance: 5500 })),
}));

describe("Integration: Add Money flow", () => {
  it("adds money and updates balance via API calls", async () => {
    const onSuccess = vi.fn();

    render(<AddMoneyForm onSuccess={onSuccess} />);

    // Fill amount and submit
    const amountInput = screen.getByPlaceholderText(/enter amount/i);
    const submitBtn = screen.getByRole("button", { name: /add money/i });

    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "500" } });
      fireEvent.click(submitBtn);
    });

    // Access mocked API methods
    const { fetchUser, createTransaction, updateUserBalance } = await import(
      "../services/api"
    );

    // Verify API calls and payloads
    await waitFor(() => {
      expect(fetchUser).toHaveBeenCalledWith(expect.any(String));
      expect(createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "credit",
          amount: 500,
          status: "success",
        })
      );
      expect(updateUserBalance).toHaveBeenCalledWith(expect.any(String), 5500);
    });

    // onSuccess callback and toast notification
    expect(onSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/successfully/i)
    );

    // Input reset after success
    await waitFor(() => {
      expect(amountInput.value).toBe("");
    });
  });
});
