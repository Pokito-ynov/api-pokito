export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ suit, rank, visible: false });
        }
    }
    return deck;
};

export const shuffle = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const getRankValue = (rank) => {
    return RANKS.indexOf(rank) + 2;
};

/**
 * Basic Five-Card Stud Hand Evaluator
 * Returns a score to compare hands.
 * This is a simplified version. A production version would need a robust library.
 */
export const evaluateHand = (cards) => {
    if (cards.length === 0) return { score: 0, text: 'Empty' };

    // Sort by rank descending
    const sorted = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));

    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);
    const values = sorted.map(c => getRankValue(c.rank));

    const isFlush = suits.every(s => s === suits[0]);

    let isStraight = true;
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i] - values[i + 1] !== 1) {
            // Check for A-5 wheel (A, 5, 4, 3, 2)
            if (i === 0 && values[0] === 14 && values[1] === 5) {
                continue; // Ace low
            }
            isStraight = false;
            break;
        }
    }

    const rankCounts = {};
    ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);

    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    // High Card Base Score: Sum of values (tie-breaker logic simplified for MVP)
    // Real poker logic needs tiered tie-breakers.
    const highCardScore = values.reduce((acc, v, i) => acc + v * Math.pow(15, 4 - i), 0);

    if (isFlush && isStraight) return { score: 9000000 + highCardScore, text: 'Straight Flush' };
    if (counts[0] === 4) return { score: 8000000 + highCardScore, text: 'Four of a Kind' };
    if (counts[0] === 3 && counts[1] === 2) return { score: 7000000 + highCardScore, text: 'Full House' };
    if (isFlush) return { score: 6000000 + highCardScore, text: 'Flush' };
    if (isStraight) return { score: 5000000 + highCardScore, text: 'Straight' };
    if (counts[0] === 3) return { score: 4000000 + highCardScore, text: 'Three of a Kind' };
    if (counts[0] === 2 && counts[1] === 2) return { score: 3000000 + highCardScore, text: 'Two Pair' };
    if (counts[0] === 2) return { score: 2000000 + highCardScore, text: 'Pair' };

    return { score: 1000000 + highCardScore, text: 'High Card' };
};
