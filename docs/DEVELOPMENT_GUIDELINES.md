# Development Guidelines

## Overview

This document provides comprehensive guidelines for developing GridTokenX Explorer, ensuring consistency, quality, and scalability across the codebase.

## Code Organization

### Directory Structure

Follow the established directory structure:

```
app/
├── (core)/              # Core application infrastructure
├── (features)/          # Feature modules
├── (shared)/            # Shared resources
├── (config)/            # Configuration files
└── (tests)/            # Testing infrastructure
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `TransactionCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useTransactionData.ts`)
- **Utilities**: camelCase (e.g., `formatAddress.ts`)
- **Types**: PascalCase with `Type` suffix (e.g., `TransactionType.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Tests**: `.spec.ts` or `.test.ts` suffix (e.g., `TransactionCard.spec.ts`)

### Barrel Exports

Use `index.ts` files for clean imports:

```typescript
// components/index.ts
export { TransactionCard } from './TransactionCard';
export { TransactionList } from './TransactionList';
export type { TransactionProps } from './types';
```

## Coding Standards

### TypeScript Guidelines

1. **Strict TypeScript**: Always use strict mode
2. **Type Safety**: Avoid `any` type, prefer `unknown` or proper typing
3. **Interfaces over Types**: Use interfaces for object shapes
4. **Enum Usage**: Use enums for constants with semantic meaning

```typescript
// Good
interface Transaction {
  id: string;
  amount: number;
  status: TransactionStatus;
}

enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

// Avoid
const transaction: any = {};
```

### React Component Guidelines

#### Functional Components

Use functional components with hooks:

```typescript
interface TransactionCardProps {
  transaction: Transaction;
  onView?: (id: string) => void;
}

export function TransactionCard({ transaction, onView }: TransactionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="transaction-card">
      {/* Component content */}
    </div>
  );
}
```

#### Component Organization

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Card } from '@/app/(shared)/components/ui/card';

// 2. Types
interface TransactionCardProps {
  transaction: Transaction;
}

// 3. Component
export function TransactionCard({ transaction }: TransactionCardProps) {
  // 4. Hooks
  const [isLoading, setIsLoading] = useState(false);

  // 5. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 6. Event handlers
  const handleView = () => {
    // Handle view action
  };

  // 7. Render
  return (
    <Card>
      {/* JSX content */}
    </Card>
  );
}
```

### Hook Guidelines

Create custom hooks for reusable logic:

```typescript
interface UseTransactionDataOptions {
  id: string;
  autoRefresh?: boolean;
}

export function useTransactionData({ id, autoRefresh = false }: UseTransactionDataOptions) {
  const [data, setData] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch logic
  }, [id, autoRefresh]);

  return { data, isLoading, error, refetch: () => {} };
}
```

## State Management

### State Management Hierarchy

1. **Global State**: Core providers (Cluster, Theme, etc.)
2. **Feature State**: Feature-specific providers
3. **Component State**: Local component state

### Provider Patterns

```typescript
// Feature-specific provider
interface TransactionsContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TransactionsState>({
    transactions: [],
    loading: false,
    error: null,
  });

  const value: TransactionsContextType = {
    ...state,
    fetchTransactions: async () => {
      // Implementation
    },
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionsProvider');
  }
  return context;
}
```

## Data Fetching

### API Layer Organization

```typescript
// app/(shared)/utils/api/transactions.ts
export interface TransactionAPI {
  getById(id: string): Promise<Transaction>;
  getList(params: TransactionListParams): Promise<Transaction[]>;
}

export const transactionAPI: TransactionAPI = {
  async getById(id: string) {
    // Implementation
  },
  async getList(params) {
    // Implementation
  },
};
```

### Error Handling

```typescript
// Custom error types
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Error handling in hooks
export function useAPICall<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<APIError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = async (apiCall: () => Promise<T>) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const apiError = err instanceof APIError ? err : new APIError('Unknown error');
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  return { data, error, isLoading, execute };
}
```

## Styling Guidelines

### Tailwind CSS Usage

1. **Component-based styling**: Use consistent class patterns
2. **Responsive design**: Mobile-first approach
3. **Semantic spacing**: Use spacing scale consistently

```typescript
// Good
<div className="flex flex-col gap-4 p-6 rounded-lg border bg-card">
  <h3 className="text-lg font-semibold">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>

// Avoid
<div className="flex flex-col gap-[16px] p-[24px] rounded-[8px] border border-border">
  <h3 className="text-[18px] font-bold">Title</h3>
</div>
```

### Theme Integration

Use theme tokens for consistency:

```typescript
// Use theme colors
<div className="bg-card text-card-foreground border-border">
  <div className="text-primary">Primary text</div>
  <div className="text-muted-foreground">Muted text</div>
</div>
```

## Testing Guidelines

### Test Structure

```typescript
// TransactionCard.spec.ts
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionCard } from './TransactionCard';

describe('TransactionCard', () => {
  const mockTransaction: Transaction = {
    id: '123',
    amount: 100,
    status: 'confirmed',
  };

  it('renders transaction information correctly', () => {
    render(<TransactionCard transaction={mockTransaction} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('calls onView when clicked', () => {
    const mockOnView = vi.fn();
    render(
      <TransactionCard 
        transaction={mockTransaction} 
        onView={mockOnView} 
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnView).toHaveBeenCalledWith('123');
  });
});
```

### Testing Best Practices

1. **Test behavior, not implementation**
2. **Use meaningful test names**
3. **Mock external dependencies**
4. **Test edge cases**
5. **Keep tests simple and focused**

## Performance Guidelines

### Code Splitting

```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Memoization

```typescript
// Use React.memo for components
export const TransactionCard = React.memo(function TransactionCard({
  transaction,
  onView,
}: TransactionCardProps) {
  return <div>{/* Component content */}</div>;
});

// Use useMemo for expensive computations
const processedData = useMemo(() => {
  return expensiveComputation(rawData);
}, [rawData]);

// Use useCallback for stable function references
const handleClick = useCallback((id: string) => {
  onView(id);
}, [onView]);
```

## Security Guidelines

### Input Validation

```typescript
// Validate user inputs
function validateAddress(address: string): boolean {
  // Implement Solana address validation
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

// Sanitize data before display
function sanitizeTransactionData(data: unknown): Transaction {
  // Implement sanitization
  return validatedData;
}
```

### XSS Prevention

```typescript
// Use proper escaping for dynamic content
function DisplayContent({ content }: { content: string }) {
  return <div>{content}</div>; // React auto-escapes
}

// Avoid dangerouslySetInnerHTML
// Bad: <div dangerouslySetInnerHTML={{ __html: userContent }} />
```

## Git Workflow

### Branch Naming

- `feature/description`: New features
- `fix/description`: Bug fixes
- `refactor/description`: Code refactoring
- `docs/description`: Documentation updates

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(transactions): add transaction filtering
fix(api): handle network errors gracefully
refactor(components): extract shared card component
docs(readme): update installation instructions
```

## Code Review Guidelines

### Review Checklist

- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] Tests are included and passing
- [ ] Performance implications are considered
- [ ] Security best practices are followed
- [ ] Documentation is updated
- [ ] Error handling is implemented
- [ ] Accessibility is considered

### Review Process

1. **Self-review**: Review your own code first
2. **Peer review**: At least one other developer review
3. **Automated checks**: CI/CD pipeline validation
4. **Approval**: Required approval before merge

## Documentation

### Code Documentation

```typescript
/**
 * Fetches transaction data from the API
 * 
 * @param id - Transaction ID to fetch
 * @param options - Additional options for the request
 * @returns Promise resolving to transaction data
 * @throws {APIError} When the request fails
 * 
 * @example
 * ```typescript
 * const transaction = await fetchTransaction('123', {
 *   includeDetails: true
 * });
 * ```
 */
export async function fetchTransaction(
  id: string,
  options?: FetchOptions
): Promise<Transaction> {
  // Implementation
}
```

### Component Documentation

Use JSDoc for props:

```typescript
interface TransactionCardProps {
  /** Transaction data to display */
  transaction: Transaction;
  /** Optional callback for view action */
  onView?: (id: string) => void;
  /** Whether to show detailed information */
  showDetails?: boolean;
}
```

## Environment Configuration

### Environment Variables

Use the centralized configuration system:

```typescript
import { envConfig } from '@/app/(config)/env';

// Use configuration
const apiUrl = envConfig.solanaRpcHttp;
const isDev = envConfig.isDevelopment;
```

### Feature Flags

Use feature flags for conditional functionality:

```typescript
import { isFeatureEnabled } from '@/app/(config)/features';

if (isFeatureEnabled('enableExperimentalFeatures')) {
  // Experimental feature code
}
```

## Monitoring and Debugging

### Error Tracking

Implement error boundaries and logging:

```typescript
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      onError={(error, errorInfo) => {
        console.error('Component error:', error, errorInfo);
        // Send to error tracking service
      }}
      fallback={<ErrorCard text="Something went wrong" />}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

### Performance Monitoring

Use React DevTools Profiler and performance APIs:

```typescript
// Performance monitoring
function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
}
```

## Conclusion

Following these guidelines ensures:
- **Consistency**: Uniform codebase across the team
- **Quality**: High-quality, maintainable code
- **Scalability**: Code that grows with the application
- **Collaboration**: Easy onboarding and teamwork
- **Performance**: Optimized user experience

Regular review and updates of these guidelines help maintain code quality as the project evolves.
