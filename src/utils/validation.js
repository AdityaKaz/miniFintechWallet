import { deriveBalance } from "../services/api";
import { FEE_PERCENT, TRANSFER_LIMIT } from "../config/constants";

// Check if user has enough balance for transfer (including fee)
export const validateSufficientBalance = (transactions, amount) => {
  const currentBalance = deriveBalance(transactions);
  const fee = amount * FEE_PERCENT;
  const totalCost = amount + fee;

  if (currentBalance < totalCost) {
    return {
      isValid: false,
      message: `Insufficient balance. You have ₹${currentBalance.toFixed(
        2
      )}, but need ₹${totalCost.toFixed(2)} (including ₹${fee.toFixed(2)} fee)`,
      details: {
        currentBalance,
        required: totalCost,
        shortfall: totalCost - currentBalance,
      },
    };
  }

  return { isValid: true, details: { currentBalance, fee, totalCost } };
};

// Check if transfer amount is valid (positive, within limit)
export const validateTransferAmount = (amount) => {
  // Check if amount is a valid number
  if (isNaN(amount) || amount === null || amount === undefined) {
    return { isValid: false, message: "Amount is required" };
  }

  // Check if positive
  if (amount <= 0) {
    return { isValid: false, message: "Amount must be greater than 0" };
  }

  // Check against limit
  if (amount > TRANSFER_LIMIT) {
    return {
      isValid: false,
      message: `Amount exceeds maximum limit of ₹${TRANSFER_LIMIT.toLocaleString()}`,
    };
  }

  return { isValid: true };
};

// Check if add money amount is valid (positive, reasonable)
export const validateAddMoneyAmount = (amount) => {
  // Check if amount is a valid number
  if (isNaN(amount) || amount === null || amount === undefined) {
    return { isValid: false, message: "Amount is required" };
  }

  // Check if positive
  if (amount <= 0) {
    return { isValid: false, message: "Amount must be greater than 0" };
  }

  // Optional: set a reasonable max for add money (e.g., 100,000)
  if (amount > 100000) {
    return {
      isValid: false,
      message: "Amount exceeds maximum top-up limit of ₹1,00,000",
    };
  }

  return { isValid: true };
};

// Check if recipient is valid (selected, exists, not sending to self)
export const validateRecipient = (
  recipientId,
  currentUserId,
  allUsers = []
) => {
  // Check if recipient is selected
  if (!recipientId) {
    return { isValid: false, message: "Please select a recipient" };
  }

  // Check if trying to transfer to self
  if (recipientId === currentUserId) {
    return { isValid: false, message: "Cannot transfer money to yourself" };
  }

  // Check if recipient exists in user list
  if (allUsers.length > 0) {
    const recipientExists = allUsers.some((user) => user.id === recipientId);
    if (!recipientExists) {
      return { isValid: false, message: "Selected recipient does not exist" };
    }
  }

  return { isValid: true };
};

// Check if transaction note/description is valid (optional, max 200 chars)
export const validateNote = (note) => {
  // Check max length only
  if (note && note.length > 200) {
    return {
      isValid: false,
      message: "Note cannot exceed 200 characters",
    };
  }

  return { isValid: true };
};

// Helper to collect all errors from multiple validations
export const collectValidationErrors = (validations) => {
  const errors = validations.filter((v) => !v.isValid).map((v) => v.message);

  return {
    isValid: errors.length === 0,
    errors,
  };
};
