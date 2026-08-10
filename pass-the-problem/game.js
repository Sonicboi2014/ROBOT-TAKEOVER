// CARD RANKING SYSTEM
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♣', '♦'];
const RANK_VALUES = { 'A': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12 };
const SUIT_VALUES = { '♠': 3, '♥': 2, '♣': 1, '♦': 0 };

class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }

    toString() {
        return this.rank + this.suit;
    }

    // Compare cards: returns 1 if this > other, -1 if this < other, 0 if equal
    compare(other) {
        const thisRankValue = RANK_VALUES[this.rank];
        const otherRankValue = RANK_VALUES[other.rank];

        if (thisRankValue > otherRankValue) return 1;
        if (thisRankValue < otherRankValue) return -1;

        // Same rank, compare suits
        const thisSuitValue = SUIT_VALUES[this.suit];
        const otherSuitValue = SUIT_VALUES[other.suit];
        if (thisSuitValue > otherSuitValue) return 1;
        if (thisSuitValue < otherSuitValue) return -1;
        return 0;
    }

    isKing() {
        return this.rank === 'K';
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (let suit of SUITS) {
            for (let rank of RANKS) {
                this.cards.push(new Card(rank, suit));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        return this.cards.pop();
    }

    hasCards() {
        return this.cards.length > 0;
    }
}

class Player {
    constructor(name, index) {
        this.name = name;
        this.index = index;
        this.card = null;
        this.hearts = 3; // Lives/health
    }

    setCard(card) {
        this.card = card;
    }

    hasCard() {
        return this.card !== null;
    }

    loseHeart() {
        this.hearts--;
    }

    isAlive() {
        return this.hearts > 0;
    }
}

class Game {
    constructor(playerCount = 4) {
        this.playerCount = playerCount;
        this.players = [];
        this.deck = new Deck();
        this.currentPlayerIndex = 0;
        this.dealerIndex = 0;
        this.round = 1;
        this.gameState = 'setup'; // setup, playing, reveal, gameover
        this.initializePlayers();
    }

    initializePlayers() {
        this.players = [];
        const names = ['GRAMA', 'FRED', 'CHARLIE', 'AMARA'];
        for (let i = 0; i < this.playerCount; i++) {
            this.players.push(new Player(names[i], i));
        }
    }

    startNewRound() {
        this.deck.reset();
        this.gameState = 'playing';
        
        // Deal one card to each player
        for (let player of this.players) {
            player.setCard(this.deck.draw());
        }

        // First player after dealer goes first
        this.currentPlayerIndex = (this.dealerIndex + 1) % this.playerCount;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getNextPlayerIndex() {
        return (this.currentPlayerIndex + 1) % this.playerCount;
    }

    getLeftPlayerIndex() {
        return (this.currentPlayerIndex + 1) % this.playerCount;
    }

    canTradeWithLeft() {
        const leftPlayerIndex = this.getLeftPlayerIndex();
        const leftPlayer = this.players[leftPlayerIndex];
        return !leftPlayer.card.isKing();
    }

    performTrade() {
        const currentPlayer = this.getCurrentPlayer();
        const leftPlayerIndex = this.getLeftPlayerIndex();
        const leftPlayer = this.players[leftPlayerIndex];

        if (leftPlayer.card.isKing()) {
            return false; // Trade blocked by King
        }

        // Exchange cards
        const tempCard = currentPlayer.card;
        currentPlayer.setCard(leftPlayer.card);
        leftPlayer.setCard(tempCard);

        return true; // Trade successful
    }

    dealerAction(keepCard = true) {
        const dealer = this.players[this.dealerIndex];

        if (dealer.card.isKing()) {
            // Dealer must keep King
            return;
        }

        if (!keepCard && this.deck.hasCards()) {
            const newCard = this.deck.draw();
            dealer.setCard(newCard);
        }
    }

    nextTurn() {
        this.currentPlayerIndex = this.getNextPlayerIndex();
    }

    endRound() {
        this.gameState = 'reveal';
        
        // Find player with lowest card
        let loserIndex = 0;
        let lowestCard = this.players[0].card;

        for (let i = 1; i < this.players.length; i++) {
            if (this.players[i].card.compare(lowestCard) < 0) {
                lowestCard = this.players[i].card;
                loserIndex = i;
            }
        }

        const loser = this.players[loserIndex];
        loser.loseHeart();

        return loserIndex;
    }

    checkGameOver() {
        const alivePlayers = this.players.filter(p => p.isAlive());
        return alivePlayers.length === 1;
    }

    getWinner() {
        return this.players.find(p => p.isAlive());
    }

    moveToNextRound() {
        this.round++;
        this.dealerIndex = (this.dealerIndex + 1) % this.playerCount;
        this.startNewRound();
    }
}

// UI CONTROLLER
class GameUI {
    constructor() {
        this.game = null;
        this.currentScreen = 'mainMenu';
        this.isPlayerTurn = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('playBtn').addEventListener('click', () => this.startGame());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('keepBtn').addEventListener('click', () => this.playerKeep());
        document.getElementById('tradeBtn').addEventListener('click', () => this.playerTrade());
        document.getElementById('nextRoundBtn').addEventListener('click', () => this.nextRound());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.backToMenu());
        document.getElementById('backBtn').addEventListener('click', () => this.closeSettings());
    }

    startGame() {
        const playerCount = parseInt(document.getElementById('playerCount').value);
        this.game = new Game(playerCount);
        this.game.startNewRound();
        this.switchScreen('gameScreen');
        this.updateGameDisplay();
    }

    switchScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
        document.getElementById(screenName).classList.remove('hidden');
        this.currentScreen = screenName;
    }

    showSettings() {
        this.switchScreen('settingsScreen');
    }

    closeSettings() {
        this.switchScreen('mainMenu');
    }

    updateGameDisplay() {
        if (!this.game) return;

        // Update dealer indicator
        const dealerIndicator = document.querySelector('.dealer-indicator');
        dealerIndicator.textContent = `DEALER: ${this.game.players[this.game.dealerIndex].name}`;

        // Update players
        const playerPositions = document.querySelectorAll('.player-position');
        for (let i = 0; i < this.game.playerCount; i++) {
            const player = this.game.players[i];
            const posElement = playerPositions[i];
            
            posElement.querySelector('.player-name').textContent = player.name;
            posElement.querySelector('.player-hearts').textContent = '❤'.repeat(player.hearts);
            posElement.querySelector('.player-card').textContent = '?'; // Hidden from other players
        }

        // Show YOUR card
        const yourCard = this.game.players[2]; // Player at bottom (index 2)
        document.getElementById('yourCard').textContent = yourCard.card.toString();

        // Update turn indicator
        const currentPlayer = this.game.getCurrentPlayer();
        const turnIndicator = document.getElementById('turnIndicator');
        
        if (currentPlayer.index === 2) {
            turnIndicator.textContent = 'YOUR TURN';
            this.isPlayerTurn = true;
            this.enableActionButtons();
        } else {
            turnIndicator.textContent = `${currentPlayer.name}'S TURN`;
            this.isPlayerTurn = false;
            this.disableActionButtons();
            setTimeout(() => this.aiTurn(), 2000);
        }
    }

    enableActionButtons() {
        document.getElementById('keepBtn').disabled = false;
        document.getElementById('tradeBtn').disabled = false;
    }

    disableActionButtons() {
        document.getElementById('keepBtn').disabled = true;
        document.getElementById('tradeBtn').disabled = true;
    }

    playerKeep() {
        if (!this.isPlayerTurn) return;
        this.handleTurn(true);
    }

    playerTrade() {
        if (!this.isPlayerTurn) return;
        this.handleTurn(false);
    }

    handleTurn(keep) {
        const currentPlayer = this.game.getCurrentPlayer();
        const messageBox = document.getElementById('messageBox');

        if (currentPlayer.index === this.game.dealerIndex) {
            // Dealer turn
            this.game.dealerAction(keep);
            messageBox.textContent = keep ? 'Dealer kept their card' : 'Dealer drew from deck';
            this.endRound();
        } else {
            // Regular player
            if (keep) {
                messageBox.textContent = `${currentPlayer.name} kept their card`;
                this.game.nextTurn();
            } else {
                const leftPlayer = this.game.players[this.game.getLeftPlayerIndex()];
                if (leftPlayer.card.isKing()) {
                    messageBox.textContent = `${leftPlayer.name} has a KING! Trade blocked!`;
                } else {
                    this.game.performTrade();
                    messageBox.textContent = `${currentPlayer.name} traded with ${leftPlayer.name}`;
                    this.game.nextTurn();
                }
            }

            // Check if we've completed all player turns
            if (this.game.currentPlayerIndex === this.game.dealerIndex) {
                // All players have gone, dealer goes next
                setTimeout(() => this.dealerTurn(), 1500);
                return;
            }

            this.disableActionButtons();
            setTimeout(() => this.updateGameDisplay(), 1500);
        }
    }

    dealerTurn() {
        const messageBox = document.getElementById('messageBox');
        messageBox.textContent = 'Dealer is making a decision...';
        
        // AI dealer: 50% chance to draw if not King
        const dealer = this.game.players[this.game.dealerIndex];
        const shouldDraw = !dealer.card.isKing() && Math.random() < 0.5;
        this.game.dealerAction(!shouldDraw);
        
        setTimeout(() => this.endRound(), 1500);
    }

    aiTurn() {
        const currentPlayer = this.game.getCurrentPlayer();
        const messageBox = document.getElementById('messageBox');

        if (currentPlayer.index === this.game.dealerIndex) {
            this.dealerTurn();
            return;
        }

        // Simple AI: if card is low, trade; otherwise keep
        const cardRankValue = RANK_VALUES[currentPlayer.card.rank];
        const shouldKeep = cardRankValue > 6; // Keep if rank > 6 (7 or higher)

        if (shouldKeep) {
            messageBox.textContent = `${currentPlayer.name} kept their card`;
            this.game.nextTurn();
        } else {
            const leftPlayer = this.game.players[this.game.getLeftPlayerIndex()];
            if (leftPlayer.card.isKing()) {
                messageBox.textContent = `${leftPlayer.name} has a KING! Trade blocked!`;
            } else {
                this.game.performTrade();
                messageBox.textContent = `${currentPlayer.name} traded with ${leftPlayer.name}`;
                this.game.nextTurn();
            }
        }

        // Check if we've completed all player turns
        if (this.game.currentPlayerIndex === this.game.dealerIndex) {
            setTimeout(() => this.dealerTurn(), 1500);
            return;
        }

        setTimeout(() => this.updateGameDisplay(), 1500);
    }

    endRound() {
        const loserIndex = this.game.endRound();
        const loser = this.game.players[loserIndex];
        const messageBox = document.getElementById('messageBox');
        messageBox.textContent = `${loser.name} lost a heart!`;

        setTimeout(() => this.showResults(), 1500);
    }

    showResults() {
        // Display all cards
        const resultCards = document.getElementById('resultCards');
        resultCards.innerHTML = '';

        const loserIndex = this.game.players.findIndex(p => {
            let isLowest = true;
            for (let other of this.game.players) {
                if (other.card.compare(p.card) < 0) {
                    isLowest = false;
                    break;
                }
            }
            return isLowest;
        });

        for (let i = 0; i < this.game.playerCount; i++) {
            const player = this.game.players[i];
            const cardEl = document.createElement('div');
            cardEl.className = 'result-card' + (i === loserIndex ? ' loser' : '');
            cardEl.innerHTML = `
                <div class="result-card-rank">${player.name}</div>
                <div class="result-card-value">${player.card.toString()}</div>
                <div class="result-card-rank">❤ ${player.hearts}</div>
            `;
            resultCards.appendChild(cardEl);
        }

        if (this.game.checkGameOver()) {
            const winner = this.game.getWinner();
            document.getElementById('resultTitle').textContent = `${winner.name} WINS!`;
            document.getElementById('nextRoundBtn').textContent = '🎮 PLAY AGAIN';
            document.getElementById('nextRoundBtn').onclick = () => this.startGame();
        } else {
            document.getElementById('resultTitle').textContent = 'ROUND ' + this.game.round + ' COMPLETE';
        }

        this.switchScreen('resultScreen');
    }

    nextRound() {
        if (this.game.checkGameOver()) {
            this.backToMenu();
        } else {
            this.game.moveToNextRound();
            this.switchScreen('gameScreen');
            this.updateGameDisplay();
        }
    }

    backToMenu() {
        this.game = null;
        this.switchScreen('mainMenu');
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.gameUI = new GameUI();
});