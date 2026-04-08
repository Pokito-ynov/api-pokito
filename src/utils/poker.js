export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = ['2', '3', '4', '5', '6', '7', 'J', 'Q', 'K', 'A'];
export const JOKER_RANK = 'JOKER';

const STANDARD_DECK = SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({ suit, rank, visible: false }))
);

const RANK_VALUES = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    J: 11,
    Q: 12,
    K: 13,
    A: 14
};

const STRAIGHT_SEQUENCES = [
    ['A', '2', '3', '4', '5'],
    ['2', '3', '4', '5', '6'],
    ['3', '4', '5', '6', '7'],
    ['4', '5', '6', '7', 'J'],
    ['5', '6', '7', 'J', 'Q'],
    ['6', '7', 'J', 'Q', 'K'],
    ['7', 'J', 'Q', 'K', 'A']
];

const ROYAL_FLUSH_SEQUENCE = ['7', 'J', 'Q', 'K', 'A'];
const SCORE_BASE = 16 ** 5;
const HAND_STRENGTH = {
    EMPTY: 0,
    HIGH_CARD: 1,
    PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FULL: 6,
    FLUSH: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10,
    FIVE_OF_A_KIND: 11
};

export const createDeck = () => {
    return [
        ...STANDARD_DECK.map((card) => ({ ...card })),
        { suit: 'joker', rank: JOKER_RANK, visible: false }
    ];
};

export const shuffle = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const getRankValue = (rank) => {
    return RANK_VALUES[rank] || 0;
};

const isJoker = (card) => card?.rank === JOKER_RANK;

const encodeValues = (values) => {
    return values.reduce((score, value) => (score * 16) + value, 0);
};

const buildResult = (strength, text, values = []) => ({
    score: (strength * SCORE_BASE) + encodeValues(values),
    text
});

const getSortedValues = (cards) => {
    return [...cards]
        .map((card) => getRankValue(card.rank))
        .sort((a, b) => b - a);
};

const getRankEntries = (cards) => {
    const counts = new Map();
    cards.forEach((card) => {
        counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
    });

    return [...counts.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return getRankValue(b[0]) - getRankValue(a[0]);
    });
};

const findStraightSequence = (cards) => {
    if (cards.length !== 5) return null;

    const uniqueRanks = new Set(cards.map((card) => card.rank));
    if (uniqueRanks.size !== 5) return null;

    return STRAIGHT_SEQUENCES.find((sequence) => sequence.every((rank) => uniqueRanks.has(rank))) || null;
};

const evaluateConcreteHand = (cards) => {
    if (cards.length === 0) return buildResult(HAND_STRENGTH.EMPTY, 'Empty');

    const cardCount = cards.length;
    const rankEntries = getRankEntries(cards);
    const sortedValues = getSortedValues(cards);
    const suits = cards.map((card) => card.suit);
    const isFlush = cardCount === 5 && suits.every((suit) => suit === suits[0]);
    const straightSequence = findStraightSequence(cards);
    const isStraight = Boolean(straightSequence);

    if (isFlush && straightSequence?.every((rank, index) => rank === ROYAL_FLUSH_SEQUENCE[index])) {
        return buildResult(HAND_STRENGTH.ROYAL_FLUSH, 'Quinte Flush Royale', [getRankValue('A')]);
    }

    if (isFlush && isStraight) {
        return buildResult(
            HAND_STRENGTH.STRAIGHT_FLUSH,
            'Quinte Flush',
            [getRankValue(straightSequence[straightSequence.length - 1])]
        );
    }

    if (cardCount >= 4 && rankEntries[0][1] === 4) {
        const fourValue = getRankValue(rankEntries[0][0]);
        const kickers = rankEntries.slice(1).map(([rank]) => getRankValue(rank)).sort((a, b) => b - a);
        return buildResult(HAND_STRENGTH.FOUR_OF_A_KIND, 'Carre', [fourValue, ...kickers]);
    }

    if (isFlush) {
        return buildResult(HAND_STRENGTH.FLUSH, 'Couleur', sortedValues);
    }

    if (cardCount === 5 && rankEntries[0][1] === 3 && rankEntries[1]?.[1] === 2) {
        return buildResult(
            HAND_STRENGTH.FULL,
            'Full',
            [getRankValue(rankEntries[0][0]), getRankValue(rankEntries[1][0])]
        );
    }

    if (isStraight) {
        return buildResult(
            HAND_STRENGTH.STRAIGHT,
            'Quinte',
            [getRankValue(straightSequence[straightSequence.length - 1])]
        );
    }

    if (cardCount >= 3 && rankEntries[0][1] === 3) {
        const threeValue = getRankValue(rankEntries[0][0]);
        const kickers = rankEntries.slice(1).map(([rank]) => getRankValue(rank)).sort((a, b) => b - a);
        return buildResult(HAND_STRENGTH.THREE_OF_A_KIND, 'Brelan', [threeValue, ...kickers]);
    }

    if (cardCount >= 4 && rankEntries[0][1] === 2 && rankEntries[1]?.[1] === 2) {
        const pairValues = rankEntries
            .filter(([, count]) => count === 2)
            .map(([rank]) => getRankValue(rank))
            .sort((a, b) => b - a);
        const kickers = rankEntries
            .filter(([, count]) => count === 1)
            .map(([rank]) => getRankValue(rank))
            .sort((a, b) => b - a);
        return buildResult(HAND_STRENGTH.TWO_PAIR, 'Double Paire', [...pairValues, ...kickers]);
    }

    if (cardCount >= 2 && rankEntries[0][1] === 2) {
        const pairValue = getRankValue(rankEntries[0][0]);
        const kickers = rankEntries.slice(1).map(([rank]) => getRankValue(rank)).sort((a, b) => b - a);
        return buildResult(HAND_STRENGTH.PAIR, 'Paire', [pairValue, ...kickers]);
    }

    return buildResult(HAND_STRENGTH.HIGH_CARD, 'Carte Haute', sortedValues);
};

const evaluateFiveOfAKind = (cards) => {
    if (cards.length !== 5) return null;

    const nonJokers = cards.filter((card) => !isJoker(card));
    const rankEntries = getRankEntries(nonJokers);
    if (rankEntries[0]?.[1] !== 4) return null;

    return buildResult(HAND_STRENGTH.FIVE_OF_A_KIND, 'Cinquan', [getRankValue(rankEntries[0][0])]);
};

const evaluateWithJoker = (cards) => {
    const jokerCard = cards.find(isJoker);
    const nonJokers = cards.filter((card) => !isJoker(card));
    let bestResult = evaluateConcreteHand(nonJokers);

    for (const replacement of STANDARD_DECK) {
        const alreadyPresent = nonJokers.some(
            (card) => card.rank === replacement.rank && card.suit === replacement.suit
        );

        if (alreadyPresent) continue;

        const result = evaluateConcreteHand([
            ...nonJokers,
            { ...replacement, visible: jokerCard?.visible ?? false }
        ]);

        if (result.score > bestResult.score) {
            bestResult = result;
        }
    }

    const fiveOfAKind = evaluateFiveOfAKind(cards);
    if (fiveOfAKind && fiveOfAKind.score > bestResult.score) {
        return fiveOfAKind;
    }

    return bestResult;
};

export const evaluateHand = (cards) => {
    if (cards.length === 0) return buildResult(HAND_STRENGTH.EMPTY, 'Empty');

    if (cards.some(isJoker)) {
        return evaluateWithJoker(cards);
    }

    return evaluateConcreteHand(cards);
};
