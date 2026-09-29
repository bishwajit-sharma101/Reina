import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './ChessGame.css';

// Piece value table for evaluation
const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece unicode glyphs for captured trays
const PIECE_GLYPHS = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
};

export default function ChessGame({
    onGameAction,
    isLoading = false,
    isTalking = false,
    closeness = 50,
    consecutiveLosses = 0,
    setConsecutiveLosses,
    setIsPouting
}) {
    // Chess game instance reference (mutable state for search)
    const gameRef = useRef(new Chess());
    const [fen, setFen] = useState(gameRef.current.fen());
    const [turn, setTurn] = useState('w');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [gameStatus, setGameStatus] = useState(null); // 'CHECK', 'WON', 'LOST', 'DRAW'
    const [capturedByReina, setCapturedByReina] = useState([]); // White pieces Reina captured
    const [capturedByDarling, setCapturedByDarling] = useState([]); // Black pieces Darling captured
    const [difficulty, setDifficulty] = useState('master'); // 'casual' | 'master'
    const [moveCount, setMoveCount] = useState(0);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [lastMove, setLastMove] = useState(null); // { from, to }
    const lastClickTimeRef = useRef(0);
    const lastClickedSquareRef = useRef(null);

    // Audio Context for sound effects
    const audioCtxRef = useRef(null);

    const playSound = useCallback((type) => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            if (type === 'capture') {
                // Punchy capture click
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(450, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'check') {
                // Warning ping
                osc.type = 'sine';
                osc.frequency.setValueAtTime(580, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else {
                // Normal piece wood thud
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.06);
            }
        } catch (e) {
            // Audio error ignored
        }
    }, []);

    // Board evaluation function
    const evaluate = useCallback((chess) => {
        if (chess.isCheckmate()) {
            return chess.turn() === 'b' ? -99999 : 99999;
        }
        if (chess.isDraw()) return 0;

        let score = 0;
        const board = chess.board();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p) {
                    let v = PIECE_VALUES[p.type] || 0;
                    // Center control bonus
                    if ((r === 3 || r === 4) && (c === 3 || c === 4)) v += 15;
                    score += p.color === 'b' ? v : -v;
                }
            }
        }
        return score;
    }, []);

    // Minimax search with alpha-beta pruning
    const minimax = useCallback((chess, depth, alpha, beta, isMaximizing) => {
        if (depth === 0 || chess.isGameOver()) {
            return evaluate(chess);
        }

        const moves = chess.moves({ verbose: true });
        // Prioritize captures for faster alpha-beta cutoff
        moves.sort((a, b) => (b.captured ? 10 : 0) - (a.captured ? 10 : 0));

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                chess.move(move);
                const ev = minimax(chess, depth - 1, alpha, beta, false);
                chess.undo();
                maxEval = Math.max(maxEval, ev);
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                chess.move(move);
                const ev = minimax(chess, depth - 1, alpha, beta, true);
                chess.undo();
                minEval = Math.min(minEval, ev);
                beta = Math.min(beta, ev);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }, [evaluate]);

    // Choose best move for Reina
    const findBestMove = useCallback((chess, depth) => {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) return null;

        // Casual mode: 25% chance of picking a random legal move for human-like blunders
        if (depth === 1 && Math.random() < 0.25) {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        let bestMove = moves[0];
        let bestVal = -Infinity;

        for (const move of moves) {
            chess.move(move);
            const val = minimax(chess, depth - 1, -Infinity, Infinity, false);
            chess.undo();
            if (val > bestVal) {
                bestVal = val;
                bestMove = move;
            }
        }
        return bestMove;
    }, [minimax]);

    // Trigger Reina's turn
    const executeReinaMove = useCallback((darlingCheckedReina) => {
        setIsAiThinking(true);

        const thinkDelay = Math.floor(Math.random() * 300) + 400; // 400-700ms natural glance
        setTimeout(() => {
            const chess = gameRef.current;
            if (chess.isGameOver()) {
                setIsAiThinking(false);
                return;
            }

            const depth = difficulty === 'master' ? 2 : 1;
            const chosenMove = findBestMove(chess, depth);
            if (!chosenMove) {
                setIsAiThinking(false);
                return;
            }

            const moveRes = chess.move(chosenMove);
            setFen(chess.fen());
            setTurn(chess.turn());
            setMoveCount(prev => prev + 1);
            setLastMove({ from: moveRes.from, to: moveRes.to });
            setSelectedSquare(null);

            const isCapture = !!moveRes.captured;
            if (isCapture) {
                setCapturedByReina(prev => [...prev, moveRes.captured]);
                playSound('capture');
            } else {
                playSound('move');
            }

            setIsAiThinking(false);

            // 1. Check if Reina Checkmated Darling
            if (chess.isCheckmate()) {
                setGameStatus('LOST'); // From Darling's perspective, Reina won
                playSound('check');
                setConsecutiveLosses(0);
                setIsPouting(false);
                onGameAction?.(
                    `[SYSTEM_CHESS] I played ${moveRes.san} and CHECKMATED Darling! Result: I WON!
CRITICAL: Respond with EXACTLY ONE short line (max 10-12 words) of smug esports champion victory gloating! Max 1 line!`,
                    `(Chess: ${moveRes.san}# - Checkmate! Reina wins!)`
                );
                return;
            }

            // 2. Check for Draw
            if (chess.isDraw()) {
                setGameStatus('DRAW');
                onGameAction?.(
                    `[SYSTEM_CHESS] I moved ${moveRes.san}. The game ended in a DRAW.
CRITICAL: Respond with EXACTLY ONE short line (max 10-12 words) of gamer banter! Max 1 line!`,
                    `(Chess: Draw)`
                );
                return;
            }

            // 3. Check if Reina gave Check
            const reinaGaveCheck = chess.inCheck();
            if (reinaGaveCheck) {
                setGameStatus('CHECK');
                playSound('check');
            } else {
                setGameStatus(null);
            }

            // 4. Dynamic Spoken Banter
            let contextNote = "";
            if (reinaGaveCheck) {
                contextNote = "I gave CHECK! Threaten his King playfully!";
            } else if (moveRes.captured === 'q') {
                contextNote = "I captured his QUEEN! Massive smug tease!";
            } else if (moveRes.captured) {
                contextNote = `I captured his ${moveRes.captured.toUpperCase()}! Troll him for hanging it!`;
            } else if (darlingCheckedReina) {
                contextNote = "Darling checked me last turn, but I deflected it like a pro!";
            } else {
                contextNote = "Normal strategic developing move. Challenge him to find a move!";
            }

            onGameAction?.(
                `[SYSTEM_CHESS] I moved ${moveRes.san}. ${contextNote}
CRITICAL: Respond with EXACTLY ONE short, punchy sentence (max 10-12 words) of high-energy gamer banter! Max 1 line!`,
                `(Chess: ${moveRes.san})`
            );
        }, thinkDelay);
    }, [difficulty, findBestMove, onGameAction, playSound, setConsecutiveLosses, setIsPouting]);

    // Handle Player's Piece Drop
    const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
        if (isAiThinking || gameRef.current.isGameOver() || turn !== 'w') return false;

        try {
            const chess = gameRef.current;
            // Attempt move with auto Queen promotion
            const move = chess.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            if (!move) return false;

            setFen(chess.fen());
            setTurn(chess.turn());
            setMoveCount(prev => prev + 1);
            setLastMove({ from: sourceSquare, to: targetSquare });
            setSelectedSquare(null);

            const isCapture = !!move.captured;
            if (isCapture) {
                setCapturedByDarling(prev => [...prev, move.captured]);
                playSound('capture');
            } else {
                playSound('move');
            }

            // 1. Check if Darling Checkmated Reina
            if (chess.isCheckmate()) {
                setGameStatus('WON'); // From Darling's perspective, Darling won
                playSound('check');
                setConsecutiveLosses(prev => prev + 1);
                setIsPouting(true);
                onGameAction?.(
                    `[SYSTEM_CHESS] Darling played ${move.san} and CHECKMATED me! Result: I LOST!
CRITICAL: Respond with EXACTLY ONE short line (max 10-12 words) of salty tsundere gamer rage or disbelief! Max 1 line!`,
                    `(Chess: ${move.san}# - Checkmate! Darling wins!)`
                );
                return true;
            }

            // 2. Check for Draw
            if (chess.isDraw()) {
                setGameStatus('DRAW');
                onGameAction?.(
                    `[SYSTEM_CHESS] Darling moved ${move.san}. Game ended in a DRAW.
CRITICAL: Respond with EXACTLY ONE short line (max 10-12 words) of gamer banter! Max 1 line!`,
                    `(Chess: Draw)`
                );
                return true;
            }

            const darlingGaveCheck = chess.inCheck();
            if (darlingGaveCheck) {
                setGameStatus('CHECK');
                playSound('check');
            } else {
                setGameStatus(null);
            }

            // Schedule Reina's move
            executeReinaMove(darlingGaveCheck);
            return true;
        } catch (e) {
            return false;
        }
    }, [executeReinaMove, isAiThinking, onGameAction, playSound, setConsecutiveLosses, setIsPouting, turn]);

    // Restart game
    const handleRestart = useCallback(() => {
        gameRef.current = new Chess();
        setFen(gameRef.current.fen());
        setTurn('w');
        setIsAiThinking(false);
        setGameStatus(null);
        setCapturedByReina([]);
        setCapturedByDarling([]);
        setMoveCount(0);
        setSelectedSquare(null);
        setLastMove(null);
        onGameAction?.(
            `[SYSTEM_CHESS] New chess game started!
CRITICAL: Give ONE quick, competitive, punchy opening boast! Max 1 line!`,
            "(Chess: New Game started)"
        );
    }, [onGameAction]);

    // Resign
    const handleResign = useCallback(() => {
        if (gameRef.current.isGameOver()) return;
        setGameStatus('LOST');
        setConsecutiveLosses(0);
        setIsPouting(false);
        onGameAction?.(
            `[SYSTEM_CHESS] Darling resigned the chess game! Result: I WON!
CRITICAL: Give ONE smug, boastful victory celebration teasing his surrender! Max 1 line!`,
            "(Chess: I resign!)"
        );
    }, [onGameAction, setConsecutiveLosses, setIsPouting]);

    // Helper to determine if a square is light or dark
    const isLightSquare = useCallback((sq) => {
        if (!sq || sq.length < 2) return false;
        const col = sq.charCodeAt(0) - 97;
        const rank = parseInt(sq[1], 10);
        return (col + rank) % 2 === 0;
    }, []);

    const getBaseSquareColor = useCallback((sq) => {
        return isLightSquare(sq) ? '#f5e8f0' : '#381c2e';
    }, [isLightSquare]);

    // Handle Click-to-Move and Square Selection
    const handleSquareSelect = useCallback((square) => {
        if (!square || isAiThinking || gameRef.current.isGameOver() || turn !== 'w') return;

        const now = Date.now();
        if (now - lastClickTimeRef.current < 60 && lastClickedSquareRef.current === square) {
            return; // Prevent duplicate trigger from event bubbling
        }
        lastClickTimeRef.current = now;
        lastClickedSquareRef.current = square;

        const chess = gameRef.current;
        const clickedPiece = chess.get(square);

        // Case 1: No square currently selected
        if (!selectedSquare) {
            // Only select White (player) pieces
            if (clickedPiece && clickedPiece.color === 'w') {
                setSelectedSquare(square);
            }
            return;
        }

        // Case 2: Clicked on the same square again -> Deselect
        if (selectedSquare === square) {
            setSelectedSquare(null);
            return;
        }

        // Case 3: Clicked another piece of own color -> Change selection
        if (clickedPiece && clickedPiece.color === 'w') {
            setSelectedSquare(square);
            return;
        }

        // Case 4: Target square clicked -> check if valid move
        const legalMoves = chess.moves({ square: selectedSquare, verbose: true });
        const isLegal = legalMoves.some(m => m.to === square);

        if (isLegal) {
            handlePieceDrop({ sourceSquare: selectedSquare, targetSquare: square });
        }
        setSelectedSquare(null);
    }, [handlePieceDrop, isAiThinking, selectedSquare, turn]);

    // Compute Dynamic Custom Square Styles (Selection border, legal move dots, check warning, last move)
    const customSquareStyles = useMemo(() => {
        const styles = {};
        const chess = gameRef.current;

        // 1. Highlight Last Move (source and destination)
        if (lastMove?.from) {
            styles[lastMove.from] = {
                backgroundColor: isLightSquare(lastMove.from) ? '#fae1ec' : '#4d233c',
                boxShadow: 'inset 0 0 0 1px rgba(244, 63, 94, 0.4)'
            };
        }
        if (lastMove?.to) {
            styles[lastMove.to] = {
                backgroundColor: isLightSquare(lastMove.to) ? '#f8d2e3' : '#5a2544',
                boxShadow: 'inset 0 0 0 2px rgba(244, 63, 94, 0.6)'
            };
        }

        // 2. King in Check Warning Highlight
        if (chess.inCheck()) {
            const turnColor = chess.turn();
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const sq = String.fromCharCode(97 + c) + (8 - r);
                    const p = chess.get(sq);
                    if (p && p.type === 'k' && p.color === turnColor) {
                        styles[sq] = {
                            backgroundColor: 'rgba(239, 68, 68, 0.65)',
                            boxShadow: 'inset 0 0 0 3px #ef4444, 0 0 18px rgba(239, 68, 68, 0.9)',
                            borderRadius: '4px'
                        };
                        break;
                    }
                }
            }
        }

        // 3. Highlight Selected Piece with Prominent Cyber Glow Border
        if (selectedSquare) {
            styles[selectedSquare] = {
                backgroundColor: isLightSquare(selectedSquare) ? '#ffd1dc' : '#5c2242',
                boxShadow: 'inset 0 0 0 3px #f43f5e, 0 0 16px rgba(244, 63, 94, 0.8)',
                borderRadius: '6px'
            };

            // 4. Highlight Valid Move Targets (Dots for empty squares, rings for captures)
            const legalMoves = chess.moves({ square: selectedSquare, verbose: true });
            legalMoves.forEach(m => {
                const targetPiece = chess.get(m.to);
                const isCapture = !!targetPiece || (m.flags && m.flags.includes('e'));
                const baseBg = getBaseSquareColor(m.to);

                if (isCapture) {
                    styles[m.to] = {
                        background: `radial-gradient(circle, transparent 52%, rgba(244, 63, 94, 0.8) 53%, rgba(244, 63, 94, 0.8) 70%, transparent 71%), ${baseBg}`,
                        boxShadow: 'inset 0 0 0 2px rgba(244, 63, 94, 0.95)',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    };
                } else {
                    styles[m.to] = {
                        background: `radial-gradient(circle, rgba(56, 189, 248, 0.9) 24%, transparent 25%), ${baseBg}`,
                        borderRadius: '4px',
                        cursor: 'pointer'
                    };
                }
            });
        }

        return styles;
    }, [fen, getBaseSquareColor, isLightSquare, lastMove, selectedSquare]);

    // Material difference calculation
    const materialAdvantage = useMemo(() => {
        let whiteVal = 0;
        let blackVal = 0;
        capturedByDarling.forEach(p => { blackVal += PIECE_VALUES[p] || 0; });
        capturedByReina.forEach(p => { whiteVal += PIECE_VALUES[p] || 0; });
        const diff = (blackVal - whiteVal) / 100;
        return diff;
    }, [capturedByDarling, capturedByReina]);

    // Chessboard Options Object for react-chessboard v5
    const chessboardOptions = useMemo(() => ({
        position: fen,
        onPieceDrop: handlePieceDrop,
        onSquareClick: ({ square }) => handleSquareSelect(square),
        onPieceClick: ({ square }) => handleSquareSelect(square),
        onPieceDrag: ({ square }) => { if (square) setSelectedSquare(square); },
        onPieceDragCancel: () => setSelectedSquare(null),
        squareStyles: customSquareStyles,
        customSquareStyles: customSquareStyles,
        boardOrientation: 'white',
        allowDragging: !isAiThinking && !gameRef.current.isGameOver() && turn === 'w',
        darkSquareStyle: { backgroundColor: '#381c2e' },
        lightSquareStyle: { backgroundColor: '#f5e8f0' },
        dropSquareStyle: { boxShadow: 'inset 0 0 1px 4px #f43f5e' },
        boardStyle: {
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(244, 63, 94, 0.25)',
            overflow: 'hidden'
        },
        animationDurationInMs: 200,
        showNotation: true,
        darkSquareNotationStyle: { color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px' },
        lightSquareNotationStyle: { color: 'rgba(56, 28, 46, 0.5)', fontSize: '10px' }
    }), [customSquareStyles, fen, handlePieceDrop, handleSquareSelect, isAiThinking, turn]);

    return (
        <div className="chess-arena-container">
            {/* Top Bar: Reina (Black) */}
            <div className={`chess-player-bar ${turn === 'b' ? 'active-turn' : ''}`}>
                <div className="chess-player-info">
                    <span className="chess-badge reina">👑 Reina</span>
                    {isAiThinking ? (
                        <span style={{ fontSize: '11px', color: '#f43f5e' }}>
                            <span className="chess-thinking-pulse" />
                            Thinking...
                        </span>
                    ) : (
                        <div className="chess-captured-tray">
                            {capturedByReina.map((p, i) => (
                                <span key={i} title={p}>{PIECE_GLYPHS.w[p] || p}</span>
                            ))}
                            {materialAdvantage < 0 && (
                                <span className="chess-advantage">+{Math.abs(materialAdvantage)}</span>
                            )}
                        </div>
                    )}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Black</div>
            </div>

            {/* Game Status Banner if in Check / Ended */}
            {gameStatus && (
                <div className={`chess-status-banner ${gameStatus === 'CHECK' ? 'check' : (gameStatus === 'LOST' ? 'won' : (gameStatus === 'WON' ? 'lost' : 'draw'))}`}>
                    {gameStatus === 'CHECK' && '⚠️ CHECK!'}
                    {gameStatus === 'LOST' && '👑 CHECKMATE — REINA WINS!'}
                    {gameStatus === 'WON' && '✨ CHECKMATE — DARLING WINS!'}
                    {gameStatus === 'DRAW' && '🤝 DRAW — STALEMATE!'}
                </div>
            )}

            {/* Chessboard Canvas */}
            <div className="chess-board-wrapper" style={{ width: 330, height: 330 }}>
                <Chessboard options={chessboardOptions} />
            </div>

            {/* Bottom Bar: Darling (White) */}
            <div className={`chess-player-bar ${turn === 'w' ? 'active-player-turn' : ''}`}>
                <div className="chess-player-info">
                    <span className="chess-badge darling">★ Darling</span>
                    <div className="chess-captured-tray">
                        {capturedByDarling.map((p, i) => (
                            <span key={i} title={p}>{PIECE_GLYPHS.b[p] || p}</span>
                        ))}
                        {materialAdvantage > 0 && (
                            <span className="chess-advantage">+{materialAdvantage}</span>
                        )}
                    </div>
                </div>
                <div style={{ fontSize: '11px', color: turn === 'w' ? '#38bdf8' : 'rgba(255,255,255,0.5)', fontWeight: turn === 'w' ? 'bold' : 'normal' }}>
                    {turn === 'w' ? '● Your Turn' : 'White'}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="chess-controls-bar">
                <button 
                    className="chess-ctrl-btn"
                    onClick={() => setDifficulty(d => d === 'master' ? 'casual' : 'master')}
                    title="Toggle Reina's AI intelligence level"
                >
                    {difficulty === 'master' ? '⭐⭐ Master' : '⭐ Casual'}
                </button>
                <button 
                    className="chess-ctrl-btn restart" 
                    onClick={handleRestart}
                    disabled={isAiThinking}
                >
                    🔄 Rematch
                </button>
                <button 
                    className="chess-ctrl-btn" 
                    onClick={handleResign}
                    disabled={isAiThinking || gameRef.current.isGameOver()}
                >
                    🏳️ Resign
                </button>
                <span className="chess-move-counter">Move #{Math.ceil((moveCount + 1) / 2)}</span>
            </div>
        </div>
    );
}
