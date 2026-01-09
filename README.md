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

```bash
npm test
```

Tests include:

- **Unit Tests** (8+): Component rendering, validation logic, API calls
- **Integration Tests** (1+): Critical flows (add money → balance update → history)
- Test framework: Vitest with React Testing Library

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
- Undo window is 6 seconds - deleted transactions auto-confirm after that
- Limited offline support - all operations require API connectivity
- No pagination on transaction list (all transactions loaded at once)

## Features Implemented

### ✅ Core Functionality

- **Dashboard**: Real-time balance display and last 10 transactions with empty/loading states
- **Add Money**: Form validation, credit transaction recording, instant balance update
- **Transfer Money**: 2% fee calculation, ₹10,000 per-transaction limit, confirmation modal
- **Transaction History**: Date range filters, status filters (all/success/pending/failed), soft delete with 6-second undo window
- **Error Handling**: Global error boundary, inline error messages, loading spinners
- **Input Validation**: Amount validation, recipient validation, numeric checks

### 🎨 UI/UX

- Dark theme with Tailwind CSS
- Responsive design (mobile-first)
- Loading skeletons for async operations
- Confirmation modals for sensitive actions
- Inline undo banner with countdown
- Real-time balance updates

### 🔒 Security & Code Quality

- Input sanitization and validation
- No unsafe HTML rendering
- Clean modular component structure
- ESLint configuration for code quality
- Proper error handling throughout

## Folder Structure

```
miniFintechWallet/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx          # Main dashboard view
│   │   ├── AddMoneyForm.jsx       # Add funds form
│   │   ├── TransferMoneyForm.jsx  # Transfer with fee calculation
│   │   ├── History.jsx            # Transaction history with filters
│   │   ├── TransactionList.jsx    # Reusable transaction display
│   │   ├── TransferConfirmationModal.jsx
│   │   └── ErrorBoundary.jsx      # Global error handler
│   ├── services/
│   │   └── api.js                 # Axios client & API calls
│   ├── config/
│   │   └── constants.js           # Fee %, limit, user ID
│   ├── utils/
│   │   └── validation.js          # Input validation helpers
│   ├── App.jsx                    # Routing & layout
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Global styles
├── public/                        # Static assets
├── db.json                        # Mock API data
├── package.json
├── vite.config.js
└── eslint.config.js
```

## Business Rules Configuration

Edit `src/config/constants.js` to adjust:

```javascript
export const TRANSFER_FEE_PERCENT = 2; // Fee percentage
export const PER_TRANSACTION_LIMIT = 10000; // Max amount per transfer
export const CURRENT_USER_ID = 1; // Active user
```

## Development Workflow

1. **Terminal 1**: Start mock API

   ```bash
   npm run mock:api
   ```

2. **Terminal 2**: Start frontend dev server

   ```bash
   npm run dev
   ```

3. **Terminal 3** (Optional): Run tests in watch mode
   ```bash
   npm test -- --watch
   ```

## Building for Production

```bash
npm run build
```

Outputs optimized files to `dist/` folder.

## Troubleshooting

| Issue                    | Solution                                                  |
| ------------------------ | --------------------------------------------------------- |
| Port 3001 already in use | Kill the process or use `npm run mock:api -- --port 3002` |
| Port 5173 already in use | Vite will use next available port automatically           |
| API calls failing        | Ensure mock API is running on http://localhost:3001       |
| Balance not updating     | Check browser console for errors; refresh page if needed  |
| Undo not appearing       | 6-second window may have expired; delete again to test    |

## Browser Support

- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
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
