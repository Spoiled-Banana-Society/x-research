// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BBB4BatchProofVRF — Chainlink VRF v2.5 backed randomness for SBS draft batches
/// @notice At each batch start the contract requests a random uint256 from
///   the Chainlink VRF v2.5 coordinator on Base mainnet. The coordinator
///   delivers the value via a callback after a few block confirmations,
///   along with a cryptographic proof verified on-chain. SBS never picks
///   the seed, and never sees a candidate value before it lands. Any seed
///   grinding ("put Jackpot at slot 99 for end-of-batch hype") is
///   eliminated at the protocol level — we don't generate the seed.
/// @dev Owner-only request. Coordinator-only callback. No funds.

interface IVRFCoordinatorV2Plus {
    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes extraArgs;
    }

    function requestRandomWords(RandomWordsRequest calldata req) external returns (uint256 requestId);
}

contract BBB4BatchProofVRF {
    // ───── ownership ─────────────────────────────────────────────────────
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotCoordinator();
    error ZeroAddress();
    error AlreadyRequested(uint256 batchNumber);
    error UnknownRequest(uint256 requestId);
    error AlreadyFulfilled(uint256 batchNumber);
    error NoRandomWords();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ───── VRF config (immutable per-deployment) ─────────────────────────
    address public immutable vrfCoordinator;
    uint256 public immutable subscriptionId;
    bytes32 public immutable keyHash;

    /// @dev Chainlink VRF v2.5 callback gas limit. 200k is plenty for our
    ///   single-uint256 storage write + event emission. Setting too high
    ///   wastes LINK; too low and the callback reverts.
    uint32 public constant CALLBACK_GAS_LIMIT = 200_000;
    /// @dev Block confirmations before fulfillment. 3 is the Base default.
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    /// @dev We only need one random word per batch.
    uint32 public constant NUM_WORDS = 1;

    /// @dev VRF v2.5 extraArgs prefix. `bytes4(keccak256("VRF ExtraArgsV1"))`.
    ///   Followed by abi.encode(ExtraArgsV1{nativePayment: bool}). We pay
    ///   in LINK from the funded subscription, so nativePayment = false.
    bytes4 internal constant EXTRA_ARGS_V1_TAG = 0x92fd1338;

    // ───── per-batch state ───────────────────────────────────────────────
    struct Batch {
        uint256 vrfRequestId;   // 0 until requested
        uint256 randomness;     // 0 until fulfilled
        uint64 requestedAt;     // block.timestamp at request
        uint64 fulfilledAt;     // 0 until fulfilled
    }

    mapping(uint256 => Batch) private _batches;
    mapping(uint256 => uint256) private _requestToBatch;

    event BatchRequested(uint256 indexed batchNumber, uint256 indexed requestId, uint64 requestedAt);
    event BatchFulfilled(uint256 indexed batchNumber, uint256 indexed requestId, uint256 randomness, uint64 fulfilledAt);

    constructor(
        address _vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        address _initialOwner
    ) {
        if (_vrfCoordinator == address(0) || _initialOwner == address(0)) revert ZeroAddress();
        vrfCoordinator = _vrfCoordinator;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        owner = _initialOwner;
        emit OwnershipTransferred(address(0), _initialOwner);
    }

    /// @notice Request randomness for a new batch from Chainlink VRF.
    ///   Idempotent: reverts if `batchNumber` was already requested.
    /// @param batchNumber 1-indexed batch number (matches DraftLeagueTracker convention).
    /// @return requestId The Chainlink VRF request id, also stored in batch state.
    function requestRandomness(uint256 batchNumber) external onlyOwner returns (uint256 requestId) {
        if (_batches[batchNumber].vrfRequestId != 0) revert AlreadyRequested(batchNumber);

        bytes memory extraArgs = abi.encodePacked(EXTRA_ARGS_V1_TAG, abi.encode(false)); // nativePayment=false

        IVRFCoordinatorV2Plus.RandomWordsRequest memory req = IVRFCoordinatorV2Plus.RandomWordsRequest({
            keyHash: keyHash,
            subId: subscriptionId,
            requestConfirmations: REQUEST_CONFIRMATIONS,
            callbackGasLimit: CALLBACK_GAS_LIMIT,
            numWords: NUM_WORDS,
            extraArgs: extraArgs
        });

        requestId = IVRFCoordinatorV2Plus(vrfCoordinator).requestRandomWords(req);

        _batches[batchNumber] = Batch({
            vrfRequestId: requestId,
            randomness: 0,
            requestedAt: uint64(block.timestamp),
            fulfilledAt: 0
        });
        _requestToBatch[requestId] = batchNumber;

        emit BatchRequested(batchNumber, requestId, uint64(block.timestamp));
    }

    /// @notice VRF coordinator callback. Stores the random word and emits
    ///   the fulfillment event. Only the coordinator can call this.
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        if (msg.sender != vrfCoordinator) revert NotCoordinator();
        uint256 batchNumber = _requestToBatch[requestId];
        if (batchNumber == 0) revert UnknownRequest(requestId);
        if (_batches[batchNumber].fulfilledAt != 0) revert AlreadyFulfilled(batchNumber);
        if (randomWords.length == 0) revert NoRandomWords();

        _batches[batchNumber].randomness = randomWords[0];
        _batches[batchNumber].fulfilledAt = uint64(block.timestamp);

        emit BatchFulfilled(batchNumber, requestId, randomWords[0], uint64(block.timestamp));
    }

    /// @notice Read everything we know about a batch's randomness.
    function getBatch(uint256 batchNumber)
        external
        view
        returns (
            uint256 vrfRequestId,
            uint256 randomness,
            uint64 requestedAt,
            uint64 fulfilledAt,
            bool fulfilled
        )
    {
        Batch memory b = _batches[batchNumber];
        return (b.vrfRequestId, b.randomness, b.requestedAt, b.fulfilledAt, b.fulfilledAt > 0);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
