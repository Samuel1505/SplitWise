# SplitWise Smart Contract Test Suite

This directory contains comprehensive tests for the SplitWise smart contract, including unit tests, integration tests, and fuzz tests.

## Test Structure

### Test Files

1. **`SplitWise.unit.ts`** - Unit tests for individual functions
   - Tests each function in isolation
   - Validates input validation and error handling
   - Verifies state changes and events

2. **`SplitWise.integration.ts`** - Integration tests for complete workflows
   - Tests end-to-end user flows
   - Multi-step scenarios (create group → add expense → settle payment)
   - Cross-token settlement workflows
   - Multiple groups and complex interactions

3. **`SplitWise.fuzz.test.ts`** - Fuzz/Property-based tests
   - Tests with random inputs
   - Validates invariants hold under various conditions
   - Edge case testing with extreme values

4. **`helpers.ts`** - Shared test utilities and helper functions

5. **`MockERC20.sol`** - Mock ERC20 token contract for testing (located in `contracts/`)

## Running Tests

### Run all tests
```bash
npx hardhat test
```

### Run specific test file
```bash
npx hardhat test test/SplitWise.unit.ts
npx hardhat test test/SplitWise.integration.ts
npx hardhat test test/SplitWise.fuzz.test.ts
```

### Run with coverage (if configured)
```bash
npx hardhat coverage
```

## Test Coverage

### Unit Tests Coverage

- **Group Management**
  - `createGroup()` - Valid/invalid inputs, duplicate checks
  - `addMember()` - Access control, validation
  - `getGroup()` - Data retrieval

- **Expense Management**
  - `createExpense()` - Amount validation, share calculations, balance updates
  - `getExpense()` - Data retrieval
  - `getExpenseShare()` - Share queries

- **Payment Settlement**
  - `settlePayment()` - ETH and ERC20 token payments
  - `settlePaymentCrossToken()` - Cross-token settlements
  - Balance updates and validation

- **Balance Queries**
  - `getBalance()` - Group-specific balances
  - `getTotalBalance()` - Cross-group balances
  - `getBalances()` - Multiple token balances

### Integration Tests Coverage

- **Complete Expense Flow**
  - Group creation → Expense creation → Payment settlement
  - Multiple expenses and partial settlements
  - Multi-token scenarios in same group

- **Multiple Groups**
  - Independent group operations
  - Cross-group balance aggregation

- **Complex Scenarios**
  - Circular debts
  - Dynamic member addition
  - Multi-user interactions

- **Edge Cases**
  - Excess ETH refund handling
  - Cross-token conversion validation

### Fuzz Tests Coverage

- **Random Input Testing**
  - Random group names and member combinations
  - Random expense amounts and splits
  - Random settlement amounts

- **Invariant Testing**
  - Sum of all balances in group = 0
  - Total balance = sum of group balances
  - Balance consistency across operations

- **Edge Cases**
  - Very large amounts (near max uint256)
  - Very small amounts (1 wei)
  - Many sequential operations

## Test Patterns

### Event Testing
Tests verify that events are emitted with correct parameters:
```typescript
const tx = await splitWise.createGroup("Test", members);
const receipt = await tx.wait();
const event = receipt.logs.find(...);
expect(event).to.not.be.undefined;
```

### Balance Verification
Tests check balance updates after operations:
```typescript
const balance = await splitWise.getBalance(user, groupId, token);
expect(balance).to.equal(expectedAmount);
```

### Error Testing
Tests verify proper error messages and revert conditions:
```typescript
await expect(
  splitWise.createGroup("", members)
).to.be.revertedWith("SplitWise: group name required");
```

### Gas Optimization Checks
Integration tests verify gas costs are reasonable for common operations.

## Mock Contracts

### MockERC20
A simple ERC20 token implementation for testing:
- Standard ERC20 functions (transfer, transferFrom, approve)
- Mint function for test setup
- Configurable decimals and initial supply

## Best Practices

1. **Isolation**: Each test is isolated and doesn't depend on others
2. **Clear Naming**: Test descriptions clearly state what is being tested
3. **Comprehensive Coverage**: Tests cover both happy paths and error cases
4. **Realistic Scenarios**: Integration tests mirror real-world usage patterns
5. **Invariant Preservation**: Fuzz tests verify mathematical invariants

## Adding New Tests

When adding new tests:

1. **Unit Tests**: Add to `SplitWise.unit.ts` in the appropriate describe block
2. **Integration Tests**: Add to `SplitWise.integration.ts` with realistic scenarios
3. **Fuzz Tests**: Add to `SplitWise.fuzz.test.ts` to test invariants with random inputs

### Test Template
```typescript
describe("Feature Name", function () {
  beforeEach(async function () {
    // Setup
  });

  it("Should do something specific", async function () {
    // Arrange
    // Act
    // Assert
  });
});
```

## Notes

- All tests use TypeScript and Ethers.js v6
- Tests follow the Hardhat testing framework patterns
- Mock ERC20 tokens are deployed for token testing scenarios
- Tests use real ETH transactions where appropriate
- Gas costs are considered but not strictly enforced

## Test Statistics

- **Unit Tests**: ~50+ test cases
- **Integration Tests**: ~15+ test scenarios  
- **Fuzz Tests**: ~10+ property-based test suites
- **Total Coverage**: Comprehensive coverage of all contract functions

## Troubleshooting

### Common Issues

1. **Gas estimation failures**: Ensure accounts have sufficient balance
2. **Event parsing errors**: Verify event signature matches contract interface
3. **Type errors**: Ensure bigint conversions are explicit
4. **Timing issues**: Use proper async/await patterns

### Debug Tips

- Use `console.log()` to debug test execution
- Check transaction receipts for detailed information
- Verify contract state between operations
- Use Hardhat console.log for on-chain debugging

