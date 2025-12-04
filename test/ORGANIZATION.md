# Test Suite Organization

The test suite has been reorganized into a clear folder structure with focused, smaller test files.

## Folder Structure

```
test/
├── unit/                    # Unit tests for individual functions
│   ├── fixtures.ts         # Shared setup for unit tests
│   ├── group.ts            # Group creation and member management
│   ├── expense.ts          # Expense creation tests
│   ├── payment.ts          # Payment settlement tests
│   ├── balance.ts          # Balance query tests
│   └── data.ts             # Data retrieval tests (getGroup, getExpense, etc.)
│
├── integration/            # Integration tests for complete workflows
│   ├── fixtures.ts         # Shared setup for integration tests
│   ├── complete-flow.test.ts      # Full expense cycles
│   ├── multiple-groups.test.ts    # Multiple groups scenarios
│   ├── multi-user.test.ts         # Complex multi-user scenarios
│   ├── cross-token.test.ts        # Cross-token settlement tests
│   └── edge-cases.test.ts         # Edge cases and error handling
│
├── fuzz/                   # Fuzz/property-based tests
│   ├── helpers.ts          # Fuzz test helper functions
│   ├── group-creation.fuzz.ts     # Group creation fuzzing
│   ├── expense-creation.fuzz.ts   # Expense creation fuzzing
│   ├── payment-settlement.fuzz.ts # Payment settlement fuzzing
│   ├── balance-invariants.fuzz.ts # Balance invariant testing
│   └── edge-cases.fuzz.ts         # Edge case fuzzing
│
├── helpers.ts              # Shared utilities (legacy, can be removed)
├── Counter.ts              # Example test (unrelated)
└── README.md               # Test documentation
```

## Running Tests

### Run all tests
```bash
npx hardhat test
```

### Run specific test suite
```bash
# All unit tests
npx hardhat test test/unit/

# All integration tests
npx hardhat test test/integration/

# All fuzz tests
npx hardhat test test/fuzz/

# Specific test file
npx hardhat test test/unit/group.ts
npx hardhat test test/integration/complete-flow.test.ts
npx hardhat test test/fuzz/group-creation.fuzz.ts
```

## File Organization

### Unit Tests (`test/unit/`)

Each file focuses on a specific aspect of the contract:

- **group.ts**: Tests for `createGroup()` and `addMember()` functions
- **expense.ts**: Tests for `createExpense()` function with various scenarios
- **payment.ts**: Tests for `settlePayment()` function (ETH and ERC20)
- **balance.ts**: Tests for `getBalance()` and `getTotalBalance()` functions
- **data.ts**: Tests for data retrieval functions (`getGroup`, `getExpense`, `getExpenseShare`)

**Shared Fixtures**: `fixtures.ts` provides common setup (contract deployment, signers, etc.)

### Integration Tests (`test/integration/`)

Each file tests complete user workflows:

- **complete-flow.test.ts**: Full expense cycles (create group → expense → settle)
- **multiple-groups.test.ts**: Independent group operations
- **multi-user.test.ts**: Complex scenarios with multiple users (circular debts, dynamic members)
- **cross-token.test.ts**: Cross-token settlement scenarios
- **edge-cases.test.ts**: Edge cases like excess ETH refunds

**Shared Fixtures**: `fixtures.ts` provides setup with multiple users and mock tokens

### Fuzz Tests (`test/fuzz/`)

Property-based testing with random inputs:

- **group-creation.fuzz.ts**: Random group names and member combinations
- **expense-creation.fuzz.ts**: Random expense amounts and splits, balance invariants
- **payment-settlement.fuzz.ts**: Random settlement amounts
- **balance-invariants.fuzz.ts**: Mathematical invariants (sum of balances = 0, etc.)
- **edge-cases.fuzz.ts**: Very large/small amounts, many sequential operations

**Helpers**: `helpers.ts` contains random generation functions and setup utilities

## Benefits of This Organization

1. **Modularity**: Each file has a single, clear responsibility
2. **Maintainability**: Easy to find and update specific test cases
3. **Readability**: Smaller files are easier to understand
4. **Scalability**: Easy to add new test files as features are added
5. **Parallelization**: Can run different test suites in parallel if needed
6. **Focused Testing**: Developers can run only the tests relevant to their changes

## Migration Notes

The original large test files are still present in the root:
- `SplitWise.unit.ts` (726 lines) → split into 5 files in `unit/`
- `SplitWise.integration.ts` (687 lines) → split into 5 files in `integration/`
- `SplitWise.fuzz.ts` (594 lines) → split into 5 files in `fuzz/`

These can be safely removed once you've verified the new structure works correctly.

## Next Steps

1. Run the tests to ensure everything works: `npx hardhat test`
2. Verify all test cases are covered in the new structure
3. Remove the original large test files if desired
4. Update any CI/CD scripts to use the new paths if needed

