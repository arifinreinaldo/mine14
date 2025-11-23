# Testing Documentation

Comprehensive testing guide for the Restaurant POS System.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Backend Tests](#backend-tests)
- [Frontend Tests](#frontend-tests)
- [E2E Tests](#e2e-tests)
- [CI/CD Integration](#cicd-integration)
- [Writing New Tests](#writing-new-tests)

## Overview

The Restaurant POS System has comprehensive test coverage across three levels:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test API endpoints and component interactions
3. **E2E Tests** - Test complete user workflows

## Testing Stack

### Backend
- **Jest** - Test framework
- **Supertest** - HTTP assertion library
- **Better-sqlite3** - In-memory test database

### Frontend
- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing
- **@testing-library/user-event** - User interaction simulation

### E2E
- **Playwright** - Cross-browser testing
- **Multi-browser support** - Chrome, Firefox, Safari, Mobile

## Running Tests

### Backend Tests

```bash
# Run all backend tests
cd backend
npm test

# Run with watch mode
npm run test:watch

# Run only integration tests
npm run test:integration

# View coverage report
npm test
# Open coverage/index.html in browser
```

### Frontend Tests

```bash
# Run all frontend tests
cd frontend
npm test

# Run with watch mode
npm run test:watch

# Run with UI
npm run test:ui

# View coverage report
npm test
# Open coverage/index.html in browser
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
cd e2e
npx playwright install

# Run E2E tests
npm test

# Run with UI mode
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# View test report
npm run report
```

### Run All Tests

```bash
# From root directory
./run-all-tests.sh
```

## Backend Tests

### Test Structure

```
backend/tests/
├── setup.js                    # Test configuration
├── unit/
│   └── database.test.js       # Database schema tests
└── integration/
    ├── tables.test.js         # Tables API tests
    ├── menu.test.js           # Menu API tests
    └── orders.test.js         # Orders API tests
```

### Unit Tests

**Database Schema Tests** (`tests/unit/database.test.js`)
- Validates table creation
- Tests data insertion
- Checks foreign key constraints

Example:
```javascript
test('should insert and retrieve a table', () => {
  const insert = db.prepare('INSERT INTO tables (table_number) VALUES (?)');
  const result = insert.run('Test Table 1');

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(result.lastInsertRowid);
  expect(table.table_number).toBe('Test Table 1');
});
```

### Integration Tests

**Tables API Tests** (`tests/integration/tables.test.js`)
- GET /api/tables - List all tables
- GET /api/tables/:id - Get specific table
- POST /api/tables - Create new table
- PUT /api/tables/:id/status - Update table status
- DELETE /api/tables/:id - Delete table

**Menu API Tests** (`tests/integration/menu.test.js`)
- GET /api/menu/categories - Get categories with items
- POST /api/menu/categories - Create category
- POST /api/menu/items - Create menu item
- PUT /api/menu/items/:id/availability - Toggle availability
- DELETE /api/menu/items/:id - Delete item

**Orders API Tests** (`tests/integration/orders.test.js`)
- GET /api/orders - List orders with filters
- POST /api/orders - Create order with items
- PUT /api/orders/:id/status - Update order status
- Table status updates on order completion

Example:
```javascript
test('should create a new order', async () => {
  const response = await request(app)
    .post('/api/orders')
    .send({
      table_id: 1,
      items: [
        { menu_item_id: 1, quantity: 2 }
      ]
    });

  expect(response.status).toBe(200);
  expect(response.body.order_number).toBeDefined();
});
```

### Coverage Goals

- **Lines**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Statements**: > 80%

## Frontend Tests

### Test Structure

```
frontend/src/tests/
├── setup.js                           # Test configuration
├── pages/
│   └── Home.test.jsx                 # Page component tests
├── components/
│   └── OrderCard.test.jsx            # Component tests
└── integration/
    └── orderFlow.test.jsx            # Integration tests
```

### Component Tests

**Home Page Tests** (`tests/pages/Home.test.jsx`)
- Renders main title
- Displays navigation cards
- Correct route links
- Technology stack info

**OrderCard Tests** (`tests/components/OrderCard.test.jsx`)
- Renders order details
- Displays order items
- Click handlers work
- Conditional rendering

Example:
```javascript
it('should render order details', () => {
  render(<OrderCard order={mockOrder} />);

  expect(screen.getByText('Table 1')).toBeInTheDocument();
  expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
});
```

### Integration Tests

**Order Flow Tests** (`tests/integration/orderFlow.test.jsx`)
- Customer order placement
- Order status updates
- Menu item retrieval
- Table management

Uses mocked axios for API calls:
```javascript
axios.post.mockResolvedValue({ data: mockOrder });
const response = await axios.post('/api/orders', orderData);
expect(response.data.order_number).toBe('ORD-12345');
```

## E2E Tests

### Test Structure

```
e2e/tests/
└── completeOrderFlow.test.js    # Full workflow tests
```

### Test Scenarios

**Complete Order Workflow**
1. Customer places order from table
2. Order appears in kitchen
3. Kitchen updates status
4. Server receives notification
5. Order marked as served

**Dashboard Navigation**
- Navigate between all dashboards
- Verify each page loads correctly
- Check navigation links work

**Kitchen Display**
- Shows order columns (New, In Progress, Ready)
- Real-time updates work
- Status changes persist

**Server Dashboard**
- Displays ready orders
- Shows empty state when no orders
- Mark as served functionality

**Admin Panel**
- Tab switching works
- Tables management
- Menu management

**Responsive Design**
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport

Example:
```javascript
test('should complete full order workflow', async ({ page }) => {
  await page.goto('/order/1');
  await page.click('button:has-text("Add")');
  await page.click('button:has-text("Place Order")');
  await expect(page.locator('text=Order Placed!')).toBeVisible();
});
```

### Cross-Browser Testing

Tests run on:
- Chrome (Desktop)
- Firefox (Desktop)
- Safari (Desktop)
- Chrome (Mobile - Pixel 5)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Run tests
        run: cd frontend && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Playwright
        run: cd e2e && npm install && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd e2e && npm test
```

## Writing New Tests

### Backend API Test Template

```javascript
describe('New Feature API', () => {
  let app, db;

  beforeAll(() => {
    // Setup test database
    const dbPath = setupTestDB();
    db = new Database(dbPath);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/feature', featureRouter);
  });

  afterAll(() => {
    db.close();
    cleanupTestDB();
  });

  test('should do something', async () => {
    const response = await request(app)
      .post('/api/feature')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });
});
```

### Frontend Component Test Template

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### E2E Test Template

```javascript
import { test, expect } from '@playwright/test';

test.describe('New Feature', () => {
  test('should perform user workflow', async ({ page }) => {
    await page.goto('/feature');

    // Interact with page
    await page.click('button:has-text("Action")');

    // Assert results
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## Best Practices

### General
- Write tests before fixing bugs (TDD)
- Keep tests isolated and independent
- Use descriptive test names
- One assertion per test when possible
- Clean up after tests

### Backend
- Use test database, never production
- Mock external services
- Test error cases
- Verify database state changes

### Frontend
- Test user behavior, not implementation
- Use accessible queries (getByRole, getByLabelText)
- Mock API calls
- Test loading and error states

### E2E
- Test critical user paths
- Keep tests fast
- Use page object pattern for complex flows
- Handle async operations properly
- Take screenshots on failure

## Debugging Tests

### Backend
```bash
# Run specific test file
npm test -- tables.test.js

# Run specific test
npm test -- -t "should create a new table"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend
```bash
# Run specific test file
npm test -- Home.test.jsx

# Debug in browser
npm run test:ui

# Watch mode
npm run test:watch
```

### E2E
```bash
# Run specific test
npx playwright test --grep "order workflow"

# Debug mode
npx playwright test --debug

# Headed mode with slowmo
npx playwright test --headed --slow-mo=1000
```

## Continuous Improvement

- Review test coverage regularly
- Add tests for bug fixes
- Update tests when features change
- Remove obsolete tests
- Monitor test execution time
- Refactor slow tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
