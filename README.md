# Mini FinTech Wallet

A wallet application demonstrating transaction management, balance tracking, and peer-to-peer transfers with fee calculations and validation.

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Mock API (Terminal 1)**

   ```bash
   npm run mock:api
   ```

   Runs on `http://localhost:3001`

3. **Start Frontend (Terminal 2)**
   ```bash
   npm run dev
   ```
   Runs on `http://localhost:5173`

## Running Tests

_Tests to be added in Day 5_

## Tech Stack

- **Frontend**: React 19, React Router 7, Axios
- **Styling**: Tailwind CSS
- **Mock API**: JSON Server
- **Build Tool**: Vite
- **Code Quality**: ESLint

## Architecture

### Project Structure

```
src/
├── components/           # React components (Dashboard, Forms, etc.)
├── services/             # API client (Axios instance)
├── config/               # Constants (fees, limits)
├── utils/                # Validation helpers
└── App.jsx              # Main routing
```

### Why These Technologies

1. **React Hooks** - Simple way to manage state without learning complex libraries
2. **JSON Server** - Fake API that works like a real API, no backend needed
3. **Axios** - Easy way to make API calls (similar to Fetch but simpler)
4. **Tailwind CSS** - Quick to style the app without writing lots of CSS
5. **Error Boundary** - Catches crashes and shows error message instead of blank page
6. **Soft Deletes** - Mark transactions as deleted instead of removing them completely

## API Endpoints

- `GET /users` - List all users
- `GET /transactions` - Get all transactions
- `POST /transactions` - Create transaction
- `PATCH /transactions/:id` - Update transaction (e.g., status)
- `DELETE /transactions/:id` - Soft delete transaction

Mock data in `db.json` includes 3 users and 8 sample transactions.

## Business Rules

- **Transfer Fee**: 2% of amount (configurable in `src/config/constants.js`)
- **Per-Transaction Limit**: ₹10,000 maximum
- **Transaction Status**: `pending`, `success`, or `failed`
- **Balance**: Calculated as sum of credits minus debits and fees per user

## Assumptions

1. Single user accessing the app (no login needed for now)
2. Balance is calculated from all transactions
3. All amounts are in INR currency
4. Basic form validation on the frontend
5. Data is stored in a JSON file (`db.json`) and resets when server restarts

## Known Limitations

- No user authentication - anyone accessing the app will see the same account
- JSON Server data is lost when the mock API restarts (not persisted to disk)
- Single user only - no support for multiple accounts or user profiles
- No transaction recovery - deleted transactions can't be restored
- Limited error feedback to user (basic validation messages only)

## Current Status

Day 1

- Project setup (Vite, React, Tailwind)
- Mock API with JSON Server
- Project structure and routing
- Error boundary and ESLint configuration

Day 2

- Dashboard shows live wallet balance (derived from transactions)
- Recent Transactions shows latest 10, sorted newest-first
- Add Money form with validation (required, > 0, ≤ ₹10,000)
- Creates a `credit` transaction via API and refreshes balance/list
- Per-user filtering using `CURRENT_USER_ID` (no login yet)

## Dependencies

All required dependencies are in `package.json`. Install with `npm install`.

**Key packages:**

- react@19.2.0
- react-router-dom@7.2.0
- axios@1.7.9
- tailwindcss@4.1.18
- json-server@1.0.0-beta.3
