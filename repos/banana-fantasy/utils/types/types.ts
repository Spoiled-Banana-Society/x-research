export type authProps = {
    isUserSignedIn: boolean
    walletAddress: null | string
    email: string | null
    name: string | null
    typeOfLogin: string | null
    profileImage: string | undefined
    tokensAvailable: number
    ethBalance: null | number
    lastGameWeek: string
    gameWeek: WeekProps[]
}

type WeekProps = {
    title: string
    gameWeek: string
}

export type mintProps = {
    count: number
    price: number
}

export enum SortState {
    ADP,
    RANK,
}

export type OwnerProps = {
    availableCredit: number
    availableEthCredit: number
    blueCheckEmail: string
    hasW9: boolean
    isBlueCheckVerified: boolean
    leagues: LeagueProps[]
    numWithdrawals: number
    pendingCredit: number
    withdrawnAmount: {
        2022: number
    }
    pfp: {
        imageUrl: string
        nftContract: string
        displayName: string
    }
}

export type LeagueProps = {
    leagueId: string
    cardId: string
}

export type NFTProps = {
    identifier: string
    collection: string
    contract: string
    token_standard: string
    name: string
    description: string
    image_url: string
    is_disabled: boolean
    is_nsfw: boolean
    metadata_url: string
}

export type LeagueDataProps = {
    available: []
    active: activeLeagueDataProps[]
}

export type LivePlayersProps = {
    id: string
    numPlayers: number
}

export type generatedCardProps = {
    card: activeLeagueDataProps
}

export type activeLeagueDataProps = {
    roster: {
        DST: null | string
        QB: null | string
        RB: null | string
        WR: null | string
        TE: null | string
    }
    _draftType: string
    _cardId: string
    _imageUrl: string
    _level: string
    _ownerId: string
    _leagueId: string
    _leagueDisplayName: string
    _leagueRank: string
    _rank: string
    _weekScore: string
    _seasonScore: string
    numPlayers: number
    prizes: {
        ETH: number
    }
    playoffs: boolean
}

export type PositionRosterProps = {
    QB: RosterProps[]
    RB: RosterProps[]
    WR: RosterProps[]
    TE: RosterProps[]
    DST: RosterProps[]
}

export type RosterProps = {
    playerId: string
    playerStateInfo: {
        displayName: string
        ownerAddress: string
        pickNum: number
        playerId: string
        position: string
        round: number
        team: string
    }
    stats: {
        averageScore: number
        highestScore: number
        playerId: string
        top5Finishes: number
        byeWeek: number
        adp: number
        playersFromTeam: null | string[]
    }
}

export type UpdatedRankings = {
    ranking: {
        playerId: string
        rank: number
        score: number
    }[]
}

export enum ViewState {
    DRAFT,
    QUEUE,
    BOARD,
    ROSTER,
    CHAT,
    LEADERBOARD,
}

export type LeaderboardProps = {
    leaderboard: LeaderboardItemProps[]
    ownersTokens: LeaderboardItemProps[]
}

export type LeaderboardItemProps = {
    _cardId: string
    roster: {
        QB: LeaderboardItemPositionProps[]
        RB: LeaderboardItemPositionProps[]
        WR: LeaderboardItemPositionProps[]
        TE: LeaderboardItemPositionProps[]
        DST: LeaderboardItemPositionProps[]
    }
    scoreWeek: number
    scoreSeason: number
    prevWeekSeasonScore: number
    ownerId: string
    level: string
    pfp: {
        imageUrl: string
        nftContract: string
        displayName: string
    }
    card: {
        _cardId: string
        _draftType: string
        _imageUrl: string
        _leagueDisplayName: string
        _leagueId: string
        _leagueRank: string
        _ownerId: string
        _rank: string
        _seasonScore: string
        _weekScore: string
        _level: string,
        prizes: {
            ETH: number
        }
    }
}

export type LeaderboardItemPositionProps = {
    playerId: string
    prevWeekSeasonContribution: number
    scoreSeason: number
    scoreWeek: number
    isUsedInCardScore: boolean
    team: string
    position: string
}

export type RankingsProps = {
    playerId: string
    rank: number
    score: number
    stats: {
        averageScore: number
        highestScore: number
        playerId: string
        top5Finishes: number
        adp: number
        byeWeek: string
        playersFromTeam: string[]
    }
}

export type PlayerStateInfo = {
    playerId: string
    displayName: string
    team: string
    position: string
    ownerAddress: string
    pickNum: number
    round: number
}

export type PlayerDataProps = {
    playerId: string
    playerStateInfo: PlayerStateInfo
    stats: {
        playerId: string
        averageScore: number
        highestScore: number
        top5Finishes: number
        adp: number
        byeWeek: number
        playersFromTeam: string[]
    }
    ranking: {
        playerId: string
        rank: number
        score: number
    }
}

export type LiveDraftPick = {
    playerId: string
    displayName: string
    team: string
    position: string
    ownerAddress: string
    pickNum: number
    round: number
}

export type draftSliceProps = {
    draftInfo: DraftInfoProps | null
    draftSummary: SummaryProps[] | null
    draftRosters: DraftRosterProps[] | null
    draftPlayerRankings: PlayerDataProps[] | null
    liveDraftPicks: LiveDraftPick[]
    sortBy: SortState
}

export type manageProps = {
    manageState: ViewState
    leagueId: string | null
    draftSummary: SummaryProps[] | null
    draftRosters: DraftRosterProps[] | null
    draftPlayerRankings: PlayerDataProps[] | null
    selectedCard: string | null
}

export type leagueProps = {
    leagueId: string | null
    leagueName: string | null
    tutorialMode: boolean
    currentRound: number | null
    currentPickNumber: number | null
    currentDrafter: string | null
    queuedPlayers: PlayerStateInfo[]
    timeRemaining: number | null
    endOfTurnTimestamp: number | null
    startOfTurnTimestamp: number | null
    autopick: boolean
    mostRecentPlayerDrafted: mostRecentPlayerProps | null
    leagueStatus: null | string
    idleCount: number
    canDraft: boolean
    tokenId: string | null
    lobbyRefresh: boolean
    shouldReconnect: boolean
    selectedCard: string | null
    viewState: ViewState
    leagueLevel: string
    audioOn: boolean
    preTimeRemaining: null | number
    generatedCard: null | string
}

export type mostRecentPlayerProps = {
    displayName: string
    ownerAddress: string
    pickNum: number
    playerId: string
    position: string
    round: number
    team: string
}

export type DraftInfoProps = {
    draftId: string
    displayName: string
    draftStartTime: number
    currentPickEndTime: number
    currentDrafter: string
    pickNumber: number
    roundNum: number
    pickInRound: number
    pickLength: number
    draftOrder: DraftOrderProps[]
}

export type DraftOrderProps = {
    ownerId: string
    tokenId: string
}

export type SummaryProps = {
    playerInfo: {
        playerId: string
        displayName: string
        team: string
        position: string
        ownerAddress: string
        pickNum: number
        round: number | null
    }
    pfpInfo: {
        imageUrl: string
        nftContract: string
        displayName: string
    }
}

export type DraftRosterProps = {
    [key: string]: {
        QB: RosterProps[]
        RB: RosterProps[]
        WR: RosterProps[]
        TE: RosterProps[]
        DST: RosterProps[]
        PFP: {
            imageUrl: string
            nftContract: string
            displayName: string
        }
    }
}

export type RosterListProps = {
    [key: string]: string
}

export type PositionProps = {
    QB: RosterProps[]
    RB: RosterProps[]
    WR: RosterProps[]
    TE: RosterProps[]
    DST: RosterProps[]
}

export enum QueriedPositon {
    ALL,
    QB,
    RB,
    WR,
    TE,
    DST,
}

export type ReferralProps = {
    ownerId: string
    promoCode: string
    numberOfUses: number
    timesMintedWithCode: number
}
