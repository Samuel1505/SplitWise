// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SplitWise
 * @notice A decentralized cross-chain expense splitting application
 * @dev Supports multiple ERC20 tokens and tracks balances between users
 */
contract SplitWise {
    // ============ Structs ============
    
    struct Group {
        uint256 id;
        string name;
        address creator;
        address[] members;
        mapping(address => bool) isMember;
        uint256 createdAt;
    }
    
    struct Expense {
        uint256 id;
        uint256 groupId;
        address payer;
        address token; // token address (address(0) for native ETH)
        uint256 amount;
        string description;
        address[] participants;
        mapping(address => uint256) shares; // amount each participant owes
        bool settled;
        uint256 createdAt;
    }
    
    struct Balance {
        address token; // token address
        uint256 amount; // amount owed (positive = owes, negative = is owed)
    }
    
    // ============ State Variables ============
    
    uint256 private _nextGroupId;
    uint256 private _nextExpenseId;
    
    mapping(uint256 => Group) public groups;
    mapping(uint256 => Expense) public expenses;
    
    // user => groupId => token => balance
    mapping(address => mapping(uint256 => mapping(address => int256))) public balances;
    
    // user => token => total balance across all groups
    mapping(address => mapping(address => int256)) public totalBalances;
    
    // ============ Events ============
    
    event GroupCreated(
        uint256 indexed groupId,
        address indexed creator,
        string name,
        address[] members
    );
    
    event MemberAdded(
        uint256 indexed groupId,
        address indexed member
    );
    
    event ExpenseCreated(
        uint256 indexed expenseId,
        uint256 indexed groupId,
        address indexed payer,
        address token,
        uint256 amount,
        string description,
        address[] participants
    );
    
    event ExpenseSettled(
        uint256 indexed expenseId,
        uint256 indexed groupId
    );
    
    event PaymentSettled(
        address indexed from,
        address indexed to,
        address indexed token,
        uint256 amount,
        uint256 groupId
    );
    
    // ============ Modifiers ============
    
    modifier onlyGroupMember(uint256 groupId) {
        require(groups[groupId].isMember[msg.sender], "SplitWise: not a group member");
        _;
    }
    
    modifier validGroup(uint256 groupId) {
        require(groups[groupId].id != 0, "SplitWise: group does not exist");
        _;
    }
    
    modifier validExpense(uint256 expenseId) {
        require(expenses[expenseId].id != 0, "SplitWise: expense does not exist");
        _;
    }
    
    // ============ Functions ============
    
    /**
     * @notice Create a new expense group
     * @param name Name of the group
     * @param members Initial members of the group (excluding creator)
     */
    function createGroup(
        string memory name,
        address[] memory members
    ) external returns (uint256) {
        require(bytes(name).length > 0, "SplitWise: group name required");
        
        uint256 groupId = ++_nextGroupId;
        Group storage group = groups[groupId];
        group.id = groupId;
        group.name = name;
        group.creator = msg.sender;
        group.createdAt = block.timestamp;
        
        // Add creator as member
        group.members.push(msg.sender);
        group.isMember[msg.sender] = true;
        
        // Add other members
        for (uint256 i = 0; i < members.length; i++) {
            require(members[i] != address(0), "SplitWise: invalid member address");
            require(!group.isMember[members[i]], "SplitWise: duplicate member");
            require(members[i] != msg.sender, "SplitWise: creator already added");
            
            group.members.push(members[i]);
            group.isMember[members[i]] = true;
        }
        
        emit GroupCreated(groupId, msg.sender, name, group.members);
        return groupId;
    }
    
    /**
     * @notice Add a member to an existing group
     * @param groupId ID of the group
     * @param member Address of the member to add
     */
    function addMember(
        uint256 groupId,
        address member
    ) external validGroup(groupId) onlyGroupMember(groupId) {
        require(member != address(0), "SplitWise: invalid member address");
        require(!groups[groupId].isMember[member], "SplitWise: member already in group");
        
        groups[groupId].members.push(member);
        groups[groupId].isMember[member] = true;
        
        emit MemberAdded(groupId, member);
    }
    
    /**
     * @notice Create a new expense in a group
     * @param groupId ID of the group
     * @param token Address of the token (address(0) for native ETH)
     * @param amount Total amount of the expense
     * @param description Description of the expense
     * @param participants Addresses of participants who should split this expense
     * @param shares Amount each participant owes (must sum to amount)
     */
    function createExpense(
        uint256 groupId,
        address token,
        uint256 amount,
        string memory description,
        address[] memory participants,
        uint256[] memory shares
    ) external validGroup(groupId) onlyGroupMember(groupId) {
        require(amount > 0, "SplitWise: amount must be positive");
        require(participants.length > 0, "SplitWise: must have at least one participant");
        require(participants.length == shares.length, "SplitWise: participants and shares length mismatch");
        
        // Verify all participants are group members
        for (uint256 i = 0; i < participants.length; i++) {
            require(
                groups[groupId].isMember[participants[i]],
                "SplitWise: participant not in group"
            );
        }
        
        // Verify shares sum to amount
        uint256 totalShares = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            totalShares += shares[i];
        }
        require(totalShares == amount, "SplitWise: shares must sum to amount");
        
        uint256 expenseId = ++_nextExpenseId;
        Expense storage expense = expenses[expenseId];
        expense.id = expenseId;
        expense.groupId = groupId;
        expense.payer = msg.sender;
        expense.token = token;
        expense.amount = amount;
        expense.description = description;
        expense.createdAt = block.timestamp;
        
        // Set participants and shares
        for (uint256 i = 0; i < participants.length; i++) {
            expense.participants.push(participants[i]);
            expense.shares[participants[i]] = shares[i];
            
            // Update balances
            // Payer is owed money, participants owe money
            if (participants[i] != msg.sender) {
                balances[participants[i]][groupId][token] += int256(shares[i]);
                balances[msg.sender][groupId][token] -= int256(shares[i]);
                
                totalBalances[participants[i]][token] += int256(shares[i]);
                totalBalances[msg.sender][token] -= int256(shares[i]);
            }
        }
        
        emit ExpenseCreated(
            expenseId,
            groupId,
            msg.sender,
            token,
            amount,
            description,
            participants
        );
    }
    
    /**
     * @notice Settle a payment between two users in a group
     * @param groupId ID of the group
     * @param token Address of the token (address(0) for native ETH)
     * @param amount Amount to settle
     * @param to Address to pay to (the person who is owed)
     */
    function settlePayment(
        uint256 groupId,
        address token,
        uint256 amount,
        address to
    ) external payable validGroup(groupId) onlyGroupMember(groupId) {
        require(amount > 0, "SplitWise: amount must be positive");
        require(to != address(0), "SplitWise: invalid recipient");
        require(to != msg.sender, "SplitWise: cannot pay yourself");
        require(groups[groupId].isMember[to], "SplitWise: recipient not in group");
        
        int256 currentBalance = balances[msg.sender][groupId][token];
        require(currentBalance > 0, "SplitWise: no balance to settle");
        require(uint256(currentBalance) >= amount, "SplitWise: insufficient balance");
        
        // Transfer tokens
        if (token == address(0)) {
            // Native ETH
            require(msg.value >= amount, "SplitWise: insufficient ETH sent");
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "SplitWise: ETH transfer failed");
            
            // Refund excess
            if (msg.value > amount) {
                (success, ) = payable(msg.sender).call{value: msg.value - amount}("");
                require(success, "SplitWise: refund failed");
            }
        } else {
            // ERC20 token
            require(msg.value == 0, "SplitWise: ETH sent for token payment");
            IERC20(token).transferFrom(msg.sender, to, amount);
        }
        
        // Update balances
        balances[msg.sender][groupId][token] -= int256(amount);
        balances[to][groupId][token] += int256(amount);
        
        totalBalances[msg.sender][token] -= int256(amount);
        totalBalances[to][token] += int256(amount);
        
        emit PaymentSettled(msg.sender, to, token, amount, groupId);
    }
    
    /**
     * @notice Get the balance of a user in a specific group for a token
     * @param user Address of the user
     * @param groupId ID of the group
     * @param token Address of the token
     * @return balance Positive means user owes, negative means user is owed
     */
    function getBalance(
        address user,
        uint256 groupId,
        address token
    ) external view validGroup(groupId) returns (int256) {
        return balances[user][groupId][token];
    }
    
    /**
     * @notice Get total balance of a user across all groups for a token
     * @param user Address of the user
     * @param token Address of the token
     * @return balance Positive means user owes, negative means user is owed
     */
    function getTotalBalance(
        address user,
        address token
    ) external view returns (int256) {
        return totalBalances[user][token];
    }
    
    /**
     * @notice Get group information
     * @param groupId ID of the group
     * @return id Group ID
     * @return name Group name
     * @return creator Group creator address
     * @return members Array of member addresses
     * @return createdAt Timestamp of creation
     */
    function getGroup(
        uint256 groupId
    ) external view validGroup(groupId) returns (
        uint256 id,
        string memory name,
        address creator,
        address[] memory members,
        uint256 createdAt
    ) {
        Group storage group = groups[groupId];
        return (
            group.id,
            group.name,
            group.creator,
            group.members,
            group.createdAt
        );
    }
    
    /**
     * @notice Get expense information
     * @param expenseId ID of the expense
     * @return id Expense ID
     * @return groupId Group ID
     * @return payer Payer address
     * @return token Token address
     * @return amount Expense amount
     * @return description Expense description
     * @return participants Array of participant addresses
     * @return settled Whether expense is settled
     * @return createdAt Timestamp of creation
     */
    function getExpense(
        uint256 expenseId
    ) external view validExpense(expenseId) returns (
        uint256 id,
        uint256 groupId,
        address payer,
        address token,
        uint256 amount,
        string memory description,
        address[] memory participants,
        bool settled,
        uint256 createdAt
    ) {
        Expense storage expense = expenses[expenseId];
        return (
            expense.id,
            expense.groupId,
            expense.payer,
            expense.token,
            expense.amount,
            expense.description,
            expense.participants,
            expense.settled,
            expense.createdAt
        );
    }
    
    /**
     * @notice Get the share amount for a participant in an expense
     * @param expenseId ID of the expense
     * @param participant Address of the participant
     * @return share Amount the participant owes
     */
    function getExpenseShare(
        uint256 expenseId,
        address participant
    ) external view validExpense(expenseId) returns (uint256) {
        return expenses[expenseId].shares[participant];
    }
    
    /**
     * @notice Get all balances for a user in a group
     * @param user Address of the user
     * @param groupId ID of the group
     * @param tokens Array of token addresses to check
     * @return tokenBalances Array of balances corresponding to tokens
     */
    function getBalances(
        address user,
        uint256 groupId,
        address[] memory tokens
    ) external view validGroup(groupId) returns (int256[] memory tokenBalances) {
        tokenBalances = new int256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            tokenBalances[i] = balances[user][groupId][tokens[i]];
        }
    }
}

// ============ Interfaces ============

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

