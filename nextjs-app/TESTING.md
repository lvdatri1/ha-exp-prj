# Testing Documentation

This project includes comprehensive automated testing using Jest for unit/integration tests and Playwright for end-to-end tests.

## Test Structure

```
nextjs-app/
├── components/__tests__/          # Component unit tests
├── lib/__tests__/                 # Database and utility tests
├── app/api/**/__tests__/          # API route tests
├── e2e/                           # End-to-end tests
├── jest.config.js                 # Jest configuration
├── jest.setup.js                  # Jest setup file
└── playwright.config.ts           # Playwright configuration
```

## Setup

### Install Dependencies

```bash
npm install
```

This will install all testing dependencies including:

- Jest (unit/integration testing)
- Testing Library (React component testing)
- Playwright (E2E testing)

### Install Playwright Browsers

```bash
npx playwright install
```

## Running Tests

### Unit & Integration Tests (Jest)

Run all unit tests:

```bash
npm test
```

Run tests in watch mode (for development):

```bash
npm run test:watch
```

Run tests with coverage report:

```bash
npm run test:coverage
```

### End-to-End Tests (Playwright)

Run E2E tests (headless):

```bash
npm run test:e2e
```

Run E2E tests with UI:

```bash
npm run test:e2e:ui
```

View test report:

```bash
npm run test:e2e:report
```

Run specific test file:

```bash
npx playwright test e2e/auth.spec.ts
```

Run tests in specific browser:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Coverage

### Unit Tests Cover:

1. **Components**

   - `PlanSelector` - Power plan selection dropdown
   - Plan loading states and error handling
   - User interactions and callbacks

2. **Database Operations**

   - User CRUD operations
   - Power plan management
   - Data retrieval and filtering

3. **API Routes**
   - Authentication endpoints
   - Power plan endpoints
   - Admin endpoints
   - Authorization checks

### E2E Tests Cover:

1. **Authentication Flow** (`e2e/auth.spec.ts`)

   - Guest login
   - User login/signup
   - Logout functionality

2. **Power Plan Management** (`e2e/power-plans.spec.ts`)

   - Plan selection
   - Tariff comparison mode
   - Plan display and updates

3. **Admin Dashboard** (`e2e/admin.spec.ts`)

   - Admin access control
   - Plan creation
   - Plan editing and deletion
   - Active status toggling

4. **Dashboard Navigation** (`e2e/dashboard.spec.ts`)

   - Tab navigation
   - Chart visualizations
   - Tariff calculator
   - Settings management

5. **API Endpoints** (`e2e/api.spec.ts`)

   - Public endpoints
   - Protected endpoints
   - Authorization checks
   - Data validation

6. **Accessibility** (`e2e/accessibility.spec.ts`)
   - Keyboard navigation
   - Screen reader support
   - Responsive design
   - ARIA labels

## Writing Tests

### Unit Test Example

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyComponent from "@/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("should perform user action", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /click me/i }).click();
  await expect(page.getByText(/success/i)).toBeVisible();
});
```

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Unit Tests
  run: npm test

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
```

## Test Best Practices

1. **Isolation** - Each test should be independent
2. **Descriptive Names** - Use clear test descriptions
3. **Arrange-Act-Assert** - Follow AAA pattern
4. **Mock External Dependencies** - Use mocks for APIs and databases
5. **Test User Behavior** - Focus on user interactions, not implementation details
6. **Keep Tests Fast** - Optimize for quick feedback
7. **Coverage** - Aim for high coverage but focus on critical paths

## Debugging Tests

### Jest Tests

Run specific test:

```bash
npm test -- PlanSelector
```

Debug with Node inspector:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Tests

Debug mode:

```bash
npx playwright test --debug
```

Show browser while testing:

```bash
npx playwright test --headed
```

Slow down execution:

```bash
npx playwright test --slow-mo=1000
```

## Troubleshooting

### Common Issues

1. **Tests timing out**

   - Increase timeout in config
   - Check for unresolved promises
   - Verify async/await usage

2. **Flaky tests**

   - Add proper wait conditions
   - Use `waitFor` instead of fixed delays
   - Check for race conditions

3. **Mock issues**
   - Clear mocks between tests
   - Verify mock implementations
   - Check module paths

### Getting Help

- Check test output for detailed error messages
- Review Playwright traces for E2E failures
- Use `--verbose` flag for more information
- Check Jest and Playwright documentation

## Coverage Reports

After running `npm run test:coverage`, view the coverage report:

```bash
# Coverage summary in terminal
# Detailed report at: coverage/lcov-report/index.html
```

Open `coverage/lcov-report/index.html` in your browser for a detailed breakdown.

## Maintenance

- Update test snapshots: `npm test -- -u`
- Update Playwright: `npm install @playwright/test@latest`
- Update browsers: `npx playwright install`
