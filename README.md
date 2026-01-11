# Mini FinTech Wallet

A small wallet app demonstrating balance, transactions, add/transfer flows, and basic business rules (fee, limit) using a mock API.

## Setup & Run

1. Install dependencies

```bash
npm install
```

2. Start mock API (json-server)

```bash
npm run mock:api
```

The mock API serves `db.json` at http://localhost:3001.

3. Start frontend (Vite)

```bash
npm run dev
```

The app runs at http://localhost:5173.

## Tests

Run all tests:

```bash
npm test
```

## Architecture Notes

- src/pages/ route-level pages (Dashboard, History)
- src/components/common/ shared components (ErrorBoundary, TransactionList)
- src/components/forms/ forms (AddMoneyForm, TransferMoneyForm)
- src/components/modals/ dialogs (TransferConfirmationModal)
- src/services/ API client
- src/config/ fee/limit/user constants
- src/utils/ validation helpers

## Assumptions

- Single active user (`CURRENT_USER_ID`) without authentication
- Amounts in INR; fee 2%, limit 10,000 (configurable in `src/config/constants.js`)
- Mock data in `db.json`; state persists only while json-server runs

## Limitations

- No authentication or multi-user switching
- Data resets when json-server restarts; no real persistence
- No pagination for history (all transactions loaded; dashboard shows last 10)
