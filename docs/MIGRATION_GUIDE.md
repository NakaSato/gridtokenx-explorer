# Migration Guide - System Design Improvements

## Overview

This guide helps developers migrate from the old codebase structure to the new, scalable architecture implemented for GridTokenX Explorer.

## Migration Summary

The migration transforms the codebase from a monolithic structure to a feature-based, modular architecture that supports large-scale development.

## Directory Changes

### Before Migration
```
app/
├── components/          # All components mixed together
├── providers/           # All providers mixed together
├── utils/              # All utilities mixed together
├── types/              # Type definitions
└── [mixed files]       # Inconsistent organization
```

### After Migration
```
app/
├── (core)/              # Core application infrastructure
├── (features)/          # Feature-based modules
├── (shared)/            # Shared resources
├── (config)/            # Configuration management
└── (tests)/            # Testing infrastructure
```

## Step-by-Step Migration

### 1. Update Import Paths

#### Old Import Patterns
```typescript
// Old way - mixed imports
import { Card } from '@components/shared/ui/card';
import { useCluster } from '@providers/cluster';
import { formatAddress } from '@utils/index';
```

#### New Import Patterns
```typescript
// New way - organized imports
import { Card } from '@/app/(shared)/components/ui/card';
import { useCluster } from '@/app/(core)/providers/cluster';
import { formatAddress } from '@/app/(shared)/utils';
```

### 2. Component Migration

#### Move Components to Appropriate Locations

**Core Components** (app/(core)/components/):
- Navbar, Header, Footer
- Layout components
- App-level wrappers

**Feature Components** (app/(features)/[feature]/components/):
- TransactionCard → app/(features)/transactions/components/
- AccountDetails → app/(features)/accounts/components/
- BlockInfo → app/(features)/blocks/components/

**Shared Components** (app/(shared)/components/):
- Button, Input, Card (UI primitives)
- Data display components
- Form components

#### Update Component Exports

```typescript
// Before
export function TransactionCard() {
  // Component implementation
}

// After
export function TransactionCard() {
  // Component implementation
}

// Also add to barrel export
// app/(features)/transactions/components/index.ts
export { TransactionCard } from './TransactionCard';
```

### 3. Provider Migration

#### Move Providers to Appropriate Locations

**Core Providers** (app/(core)/providers/):
- ClusterProvider, ThemeProvider
- Global state providers
- App-level context

**Feature Providers** (app/(core)/providers/[feature]/):
- AccountsProvider → app/(core)/providers/accounts/
- TransactionsProvider → app/(core)/providers/transactions/

#### Update Provider Usage

```typescript
// Before
import { useCluster } from '@providers/cluster';

// After
import { useCluster } from '@/app/(core)/providers/cluster';
```

### 4. Utility Migration

#### Organize Utilities by Purpose

**Core Utilities** (app/(core)/utils/):
- App-specific utilities
- Core business logic

**Shared Utilities** (app/(shared)/utils/):
- General purpose utilities
- Reusable functions
- Third-party integrations

#### Update Utility Imports

```typescript
// Before
import { formatAddress } from '@utils/index';

// After
import { formatAddress } from '@/app/(shared)/utils';
```

### 5. Type Migration

#### Centralize Type Definitions

**Shared Types** (app/(shared)/types/):
- Common interfaces
- Shared type definitions
- API response types

**Feature Types** (app/(features)/[feature]/types/):
- Feature-specific types
- Component props interfaces
- Domain models

## Migration Checklist

### Phase 1: Setup (✅ Completed)
- [x] Create new directory structure
- [x] Set up configuration management
- [x] Create barrel exports
- [x] Document new architecture

### Phase 2: Core Migration (🔄 In Progress)
- [ ] Move core components
- [ ] Move core providers
- [ ] Update import paths in layout files
- [ ] Test core functionality

### Phase 3: Feature Migration (📋 Planned)
- [ ] Migrate account-related code
- [ ] Migrate transaction-related code
- [ ] Migrate block-related code
- [ ] Migrate analytics components
- [ ] Update feature routes

### Phase 4: Shared Migration (📋 Planned)
- [ ] Move shared components
- [ ] Move shared utilities
- [ ] Consolidate type definitions
- [ ] Update all imports

### Phase 5: Testing (📋 Planned)
- [ ] Update test imports
- [ ] Move test utilities
- [ ] Update test configurations
- [ ] Verify all tests pass

### Phase 6: Cleanup (📋 Planned)
- [ ] Remove old directories
- [ ] Clean up unused imports
- [ ] Update documentation
- [ ] Verify bundle sizes

## Common Migration Issues and Solutions

### 1. Import Path Errors

**Problem**: TypeScript cannot find modules after migration
```typescript
// Error: Cannot find module '@/app/(shared)/components'
```

**Solution**: 
1. Ensure TypeScript configuration includes new paths
2. Check barrel exports exist
3. Verify file extensions (.tsx vs .ts)

### 2. Missing Exports

**Problem**: Import errors after moving files
```typescript
// Error: Module has no exported member
```

**Solution**:
1. Add export to component file
2. Update barrel export (index.ts)
3. Check for default vs named exports

### 3. Circular Dependencies

**Problem**: Circular dependency errors after reorganization
```typescript
// Error: Circular dependency detected
```

**Solution**:
1. Review dependency graph
2. Extract shared logic to utilities
3. Use dependency injection patterns

### 4. Bundle Size Issues

**Problem**: Larger bundle size after migration
```typescript
// Issue: Bundle size increased
```

**Solution**:
1. Implement code splitting
2. Use dynamic imports for large features
3. Optimize barrel exports

## Testing Migration

### 1. Update Test Imports

```typescript
// Before
import { render } from '@testing-library/react';
import { MyComponent } from '@components/MyComponent';

// After
import { render } from '@testing-library/react';
import { MyComponent } from '@/app/(shared)/components/MyComponent';
```

### 2. Update Mock Paths

```typescript
// Before
jest.mock('@providers/cluster', () => ({
  useCluster: jest.fn(),
}));

// After
jest.mock('@/app/(core)/providers/cluster', () => ({
  useCluster: jest.fn(),
}));
```

### 3. Verify Test Coverage

```bash
# Run tests to verify migration
npm run test

# Check coverage
npm run test:coverage
```

## Performance Considerations

### 1. Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze
```

### 2. Lazy Loading

```typescript
// Implement lazy loading for large features
const HeavyFeature = lazy(() => import('@/app/(features)/analytics'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyFeature />
    </Suspense>
  );
}
```

### 3. Tree Shaking

```typescript
// Use barrel exports effectively
import { Card } from '@/app/(shared)/components'; // Good
import * as Components from '@/app/(shared)/components'; // Bad
```

## Rollback Plan

If migration encounters critical issues:

### 1. Partial Rollback
- Revert specific problematic migrations
- Keep successful improvements
- Fix issues before retrying

### 2. Full Rollback
- Use Git to revert to previous commit
- Identify root cause of issues
- Plan revised migration approach

### 3. Emergency Procedures
- Deploy previous stable version
- Communicate with team
- Create hotfix branch

## Best Practices During Migration

### 1. Incremental Migration
- Migrate one module at a time
- Test each migration step
- Commit frequently with clear messages

### 2. Team Coordination
- Coordinate with other developers
- Avoid conflicting changes
- Communicate migration progress

### 3. Documentation Updates
- Update documentation as you migrate
- Note any deviations from plan
- Share lessons learned

### 4. Testing Throughout
- Test each migrated component
- Run integration tests
- Monitor application performance

## Post-Migration Tasks

### 1. Performance Optimization
- Analyze bundle sizes
- Implement additional code splitting
- Optimize imports and exports

### 2. Documentation Updates
- Update API documentation
- Create component library docs
- Update onboarding guides

### 3. Tooling Updates
- Update ESLint configurations
- Adjust build scripts
- Configure CI/CD pipelines

### 4. Team Training
- Conduct training sessions
- Share best practices
- Gather feedback for improvements

## Support and Resources

### 1. Documentation
- [Architecture Guide](./ARCHITECTURE.md)
- [Development Guidelines](./DEVELOPMENT_GUIDELINES.md)
- [System Design Improvements](./SYSTEM_DESIGN_IMPROVEMENTS.md)

### 2. Tools and Scripts
- Migration helper scripts
- Import path updater
- Bundle analysis tools

### 3. Communication Channels
- Team Slack/Discord
- Code review discussions
- Regular sync meetings

## Conclusion

This migration guide provides a structured approach to transitioning to the new architecture. By following these steps and best practices, teams can successfully migrate to a more scalable, maintainable codebase while minimizing disruption to development workflows.

Remember to:
1. **Migrate incrementally** - don't try to do everything at once
2. **Test thoroughly** - ensure each migration step works correctly
3. **Communicate** - keep the team informed of progress
4. **Document** - update documentation as changes are made
5. **Monitor** - watch for performance and functionality issues

The new architecture will provide long-term benefits in scalability, maintainability, and developer productivity that outweigh the short-term migration effort.
