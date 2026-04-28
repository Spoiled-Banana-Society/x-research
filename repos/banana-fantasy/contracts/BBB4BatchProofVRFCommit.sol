// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BBB4BatchProofVRFCommit — VRF v2.5 randomness + commit/reveal salt
/// @notice Combines two cryptographic primitives so neither SBS nor users
///   can manipulate batch outcomes:
///
///   - Chainlink VRF v2.5 supplies on-chain verifiable randomness. SBS
///     never picks the random number; the coordinator publishes a value
///     bound to a cryptographic proof the contract verifies on-chain.
///     This eliminates seed-grinding ("commit a favorable seed").
///
///   - A SBS-side salt is committed (as keccak256 hash) atomically with
///     the VRF request, then revealed only after the batch closes. Slot
///     positions derive from `keccak256(salt || randomness)`. Until the
///     salt is revealed, no one — not even SBS — can publicly prove which
///     draft is which type, because half the entropy is sealed. This
///     eliminates the user attack ("scrape on-chain randomness, target the
///     known Jackpot draft").
///
///   Together: SBS can't grind (VRF entropy is bound), users can't peek
///   (salt is hidden), and at end-of-batch the salt unlocks so anyone can
///   re-derive every position and confirm the assignments were honest.
///
/// @dev Owner-only request + reveal. Coordinator-only callback. No funds.

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

contract BBB4BatchProofVRFCommit {
    // ───── ownership ─────────────────────────────────────────────────────
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error NotCoordinator();
    error ZeroAddress();
    error ZeroHash();
    error AlreadyRequested(uint256 batchNumber);
    error UnknownRequest(uint256 requestId);
    error AlreadyFulfilled(uint256 batchNumber);
    error NotFulfilled(uint256 batchNumber);
    error AlreadyRevealed(uint256 batchNumber);
    error SaltMismatch(uint256 batchNumber);
    error NoRandomWords();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ───── VRF config (immutable per-deployment) ─────────────────────────
    address public immutable vrfCoordinator;
    uint256 public immutable subscriptionId;
    bytes32 public immutable keyHash;

    /// @dev Chainlink VRF v2.5 callback gas limit. 200k handles the
    ///   single-uint256 storage write + event emission.
    uint32 public constant CALLBACK_GAS_LIMIT = 200_000;
    /// @dev Block confirmations before fulfillment. 3 is the Base default.
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    /// @dev One random word per batch is enough — we expand it via HMAC
    ///   off-chain for the 6 slot positions.
    uint32 public constant NUM_WORDS = 1;

    /// @dev VRF v2.5 extraArgs prefix `bytes4(keccak256("VRF ExtraArgsV1"))`,
    ///   followed by abi.encode(ExtraArgsV1{nativePayment: bool}). We pay
    ///   in LINK from the funded subscription, so nativePayment = false.
    bytes4 internal constant EXTRA_ARGS_V1_TAG = 0x92fd1338;

    // ───── per-batch state ───────────────────────────────────────────────
    struct Batch {
        uint256 vrfRequestId;   // 0 until requested
        uint256 randomness;     // 0 until VRF fulfills
        bytes32 saltHash;       // keccak256(salt) — committed at request time
        bytes32 salt;            // 0x0 until revealSalt() succeeds
        uint64 requestedAt;     // block.timestamp at request+commit
        uint64 fulfilledAt;     // 0 until VRF fulfills
        uint64 revealedAt;      // 0 until salt revealed
    }

    mapping(uint256 => Batch) private _batches;
    mapping(uint256 => uint256) private _requestToBatch;

    event BatchRequested(
        uint256 indexed batchNumber,
        uint256 indexed requestId,
        bytes32 saltHash,
        uint64 requestedAt
    );
    event BatchFulfilled(
        uint256 indexed batchNumber,
        uint256 indexed requestId,
        uint256 randomness,
        uint64 fulfilledAt
    );
    event BatchRevealed(
        uint256 indexed batchNumber,
        bytes32 salt,
        uint64 revealedAt
    );

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

    /// @notice Atomically commit a salt hash and request VRF randomness for
    ///   `batchNumber`. The salt hash binds SBS to a specific salt off-chain;
    ///   the VRF request binds to coordinator-supplied entropy. Neither can
    ///   be changed after this tx.
    /// @param batchNumber 1-indexed batch number.
    /// @param saltHash keccak256 of the off-chain server-side salt.
    /// @return requestId The Chainlink VRF request id.
    function requestRandomnessAndCommit(uint256 batchNumber, bytes32 saltHash)
        external
        onlyOwner
        returns (uint256 requestId)
    {
        if (_batches[batchNumber].vrfRequestId != 0) revert AlreadyRequested(batchNumber);
        if (saltHash == bytes32(0)) revert ZeroHash();

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
            saltHash: saltHash,
            salt: bytes32(0),
            requestedAt: uint64(block.timestamp),
            fulfilledAt: 0,
            revealedAt: 0
        });
        _requestToBatch[requestId] = batchNumber;

        emit BatchRequested(batchNumber, requestId, saltHash, uint64(block.timestamp));
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

    /// @notice Reveal the salt for `batchNumber` after the batch has
    ///   closed. The contract verifies keccak256(salt) matches the
    ///   committed hash; on success the salt is stored on-chain so anyone
    ///   can derive slot positions independently.
    /// @param batchNumber 1-indexed batch number.
    /// @param salt The 32-byte salt that was committed at request time.
    function revealSalt(uint256 batchNumber, bytes32 salt) external onlyOwner {
        Batch storage b = _batches[batchNumber];
        if (b.fulfilledAt == 0) revert NotFulfilled(batchNumber);
        if (b.revealedAt != 0) revert AlreadyRevealed(batchNumber);
        if (keccak256(abi.encodePacked(salt)) != b.saltHash) revert SaltMismatch(batchNumber);

        b.salt = salt;
        b.revealedAt = uint64(block.timestamp);

        emit BatchRevealed(batchNumber, salt, uint64(block.timestamp));
    }

    /// @notice Read everything publicly known about a batch.
    function getBatch(uint256 batchNumber)
        external
        view
        returns (
            uint256 vrfRequestId,
            uint256 randomness,
            bytes32 saltHash,
            bytes32 salt,
            uint64 requestedAt,
            uint64 fulfilledAt,
            uint64 revealedAt,
            bool fulfilled,
            bool revealed
        )
    {
        Batch memory b = _batches[batchNumber];
        return (
            b.vrfRequestId,
            b.randomness,
            b.saltHash,
            b.salt,
            b.requestedAt,
            b.fulfilledAt,
            b.revealedAt,
            b.fulfilledAt > 0,
            b.revealedAt > 0
        );
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
