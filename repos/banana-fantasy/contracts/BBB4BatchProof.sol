// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BBB4BatchProof — provably-fair commit/reveal for SBS draft batches
/// @notice Tiny on-chain ledger that anchors each 100-draft batch's seed hash
///   on Base mainnet before the batch fills, and lets the seed be revealed
///   afterward. Anyone can recompute the 5 HOF + 1 Jackpot slot positions
///   from the revealed seed and verify they match the published values.
/// @dev No funds. No upgradability. No external calls. The whole point is
///   that the chain itself is the proof — keep the surface area minimal.
contract BBB4BatchProof {
    address public owner;

    struct Commit {
        bytes32 seedHash;        // keccak256(serverSeed)
        bytes32 serverSeed;      // 0x0 until revealed
        uint64 committedAt;      // block.timestamp at commit
        uint64 revealedAt;       // 0 until revealed
        uint8[6] slots;          // [jackpot, hof1, hof2, hof3, hof4, hof5] within 0..99
        bool slotsPublished;     // true after the backend posts derived slots
    }

    mapping(uint256 => Commit) private _commits;

    event BatchCommitted(
        uint256 indexed batchNumber,
        bytes32 seedHash,
        uint64 committedAt
    );

    event BatchSlotsPublished(
        uint256 indexed batchNumber,
        uint8 jackpotSlot,
        uint8[5] hofSlots
    );

    event BatchRevealed(
        uint256 indexed batchNumber,
        bytes32 serverSeed,
        uint64 revealedAt
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "BBB4BatchProof: not owner");
        _;
    }

    constructor(address initialOwner) {
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    /// @notice Commit the keccak256 hash of a 32-byte server seed for a batch.
    ///   Must happen BEFORE any draft in the batch fills, so the chain
    ///   timestamp is independent of the eventual outcomes.
    function commit(uint256 batchNumber, bytes32 seedHash) external onlyOwner {
        require(seedHash != bytes32(0), "BBB4BatchProof: empty hash");
        Commit storage c = _commits[batchNumber];
        require(c.seedHash == bytes32(0), "BBB4BatchProof: already committed");
        c.seedHash = seedHash;
        c.committedAt = uint64(block.timestamp);
        emit BatchCommitted(batchNumber, seedHash, uint64(block.timestamp));
    }

    /// @notice Publish the derived slot positions for a batch. Called by
    ///   the backend immediately after commit so the public on-chain ledger
    ///   has the deterministic outputs alongside the hash. Anyone re-running
    ///   deriveBatchSlots(serverSeed, batchNumber) post-reveal must reproduce
    ///   exactly these values.
    /// @param jackpotSlot 0..99 — position of the single Jackpot draft.
    /// @param hofSlots 5 distinct positions in 0..99, none equal to jackpotSlot.
    function publishSlots(
        uint256 batchNumber,
        uint8 jackpotSlot,
        uint8[5] calldata hofSlots
    ) external onlyOwner {
        Commit storage c = _commits[batchNumber];
        require(c.seedHash != bytes32(0), "BBB4BatchProof: not committed");
        require(!c.slotsPublished, "BBB4BatchProof: slots already published");
        require(jackpotSlot < 100, "BBB4BatchProof: jackpot OOR");

        for (uint256 i = 0; i < 5; i++) {
            require(hofSlots[i] < 100, "BBB4BatchProof: hof OOR");
            require(hofSlots[i] != jackpotSlot, "BBB4BatchProof: hof==jackpot");
            for (uint256 j = i + 1; j < 5; j++) {
                require(hofSlots[i] != hofSlots[j], "BBB4BatchProof: hof dup");
            }
        }

        c.slots[0] = jackpotSlot;
        for (uint256 i = 0; i < 5; i++) {
            c.slots[i + 1] = hofSlots[i];
        }
        c.slotsPublished = true;
        emit BatchSlotsPublished(batchNumber, jackpotSlot, hofSlots);
    }

    /// @notice Reveal the server seed for a batch. The contract enforces
    ///   keccak256(serverSeed) == seedHash. Should be called after the
    ///   batch's last draft fills.
    function reveal(uint256 batchNumber, bytes32 serverSeed) external onlyOwner {
        Commit storage c = _commits[batchNumber];
        require(c.seedHash != bytes32(0), "BBB4BatchProof: not committed");
        require(c.revealedAt == 0, "BBB4BatchProof: already revealed");
        require(keccak256(abi.encodePacked(serverSeed)) == c.seedHash, "BBB4BatchProof: hash mismatch");
        c.serverSeed = serverSeed;
        c.revealedAt = uint64(block.timestamp);
        emit BatchRevealed(batchNumber, serverSeed, uint64(block.timestamp));
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "BBB4BatchProof: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ───── views ─────────────────────────────────────────────────────────

    function getCommit(uint256 batchNumber)
        external
        view
        returns (
            bytes32 seedHash,
            bytes32 serverSeed,
            uint64 committedAt,
            uint64 revealedAt,
            uint8 jackpotSlot,
            uint8[5] memory hofSlots,
            bool slotsPublished
        )
    {
        Commit storage c = _commits[batchNumber];
        seedHash = c.seedHash;
        serverSeed = c.serverSeed;
        committedAt = c.committedAt;
        revealedAt = c.revealedAt;
        jackpotSlot = c.slots[0];
        for (uint256 i = 0; i < 5; i++) {
            hofSlots[i] = c.slots[i + 1];
        }
        slotsPublished = c.slotsPublished;
    }
}
