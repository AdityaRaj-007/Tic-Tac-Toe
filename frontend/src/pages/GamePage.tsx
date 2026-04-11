import { useEffect, useState } from "react";
import { useNakama } from "../context/NakamaContext";
import { useNavigate } from "react-router-dom";

const OpCode = {
  GAME_STATE: 1,
  MAKE_MOVE: 2,
  GAME_OVER: 3,
  GET_STATE: 4,
};

interface GameState {
  board: string[];
  currentTurn: string;
  players: { [userId: string]: string };
}

interface GameOver {
  winner: string | null;
  draw: boolean;
}

const GamePage = () => {
  const [currUserName, setCurrUserName] = useState<string | null>(null);
  const [oppUserName, setOppUserName] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<GameOver | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [gameMode, setGameMode] = useState<string>("classic");

  const [gameState, setGameState] = useState<GameState>({
    board: ["", "", "", "", "", "", "", "", ""],
    currentTurn: "",
    players: {},
  });

  const [mySymbol, setMySymbol] = useState<string | null>(null);
  const { session, client, matchId, socket, setOpponent } = useNakama();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !matchId) return;

    const handler = (matchData: any) => {
      let payload: any;
      try {
        payload =
          typeof matchData.data === "string"
            ? JSON.parse(matchData.data)
            : JSON.parse(new TextDecoder().decode(matchData.data));
      } catch (err) {
        console.error("Failed to parse match data:", err);
        return;
      }

      switch (matchData.op_code) {
        case OpCode.GAME_STATE:
          setGameState({
            board: payload.board.map((cell: string | null) => cell ?? ""),
            currentTurn: payload.currentTurn,
            players: payload.players || {},
          });
          if (payload.mode) setGameMode(payload.mode);
          setTimeLeft(payload.deadlineRemaining || 30);
          if (session && payload.players?.[session.user_id]) {
            setMySymbol(payload.players[session.user_id]);
          }
          break;

        case OpCode.GAME_OVER:
          setGameState((prev) => ({
            ...prev,
            board: payload.board.map((cell: string | null) => cell ?? ""),
          }));
          setGameOver({ winner: payload.winner, draw: payload.draw });
          setOpponent(null);
          break;
      }
    };

    socket.onmatchdata = handler;
    return () => { socket.onmatchdata = null; };
  }, [socket, matchId, session]);

  useEffect(() => {
    if (!socket || !matchId) return;
    socket.sendMatchState(matchId, OpCode.GET_STATE, JSON.stringify({}));
  }, [socket, matchId]);

  const handleMove = async (index: number) => {
    if (!socket || !matchId || !session) return;
    if (
      gameState.board[index] !== "" ||
      gameState.currentTurn !== session.user_id ||
      gameOver
    )
      return;
    try {
      await socket.sendMatchState(
        matchId,
        OpCode.MAKE_MOVE,
        JSON.stringify({ cellIndex: index })
      );
    } catch (err) {
      console.error("Failed to send move:", err);
    }
  };

  useEffect(() => {
    const getDisplayNames = async () => {
      try {
        if (session) {
          const account = await client.getAccount(session);
          setCurrUserName(account.user.display_name || account.user.username);
        }
        const playerIds = Object.keys(gameState.players);
        const opponentId = playerIds.find((id) => id !== session?.user_id);
        if (session && opponentId) {
          const users = await client.getUsers(session, [opponentId]);
          if (users.users && users.users.length > 0) {
            setOppUserName(
              users.users[0].display_name || users.users[0].username
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };
    getDisplayNames();
  }, [client, session, matchId, gameState.players]);

  const isMyTurn = gameState.currentTurn === session?.user_id;
  const didIWin = gameOver?.winner === session?.user_id;

  useEffect(() => {
    if (gameOver) {
      const timer = setTimeout(() => navigate("/leaderboard"), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameOver, navigate]);

  useEffect(() => {
    if (gameOver || !isMyTurn || gameMode === "classic") return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isMyTurn, gameOver, gameMode]);

  return (
    <div className="dark:bg-gray-900 min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-y-6">

      {/* Players */}
      <div className="w-full max-w-sm sm:max-w-md flex items-center justify-between gap-x-3">
        <div className="flex-1 text-green-500 bg-gray-800 px-3 sm:px-5 py-2 sm:py-3 rounded-lg shadow-lg border border-green-500 shadow-green-500/20 flex flex-col items-center justify-center gap-y-1 text-center">
          <span className="font-bold text-sm sm:text-lg truncate max-w-full">
            {currUserName || "You"}
          </span>
          {mySymbol && (
            <span className="text-xs sm:text-sm text-gray-400">({mySymbol})</span>
          )}
        </div>

        <div className="text-gray-400 text-sm sm:text-lg font-bold shrink-0">VS</div>

        <div className="flex-1 text-red-500 bg-gray-800 px-3 sm:px-5 py-2 sm:py-3 rounded-lg shadow-lg border border-red-500 shadow-red-500/20 flex flex-col items-center justify-center gap-y-1 text-center">
          <span className="font-bold text-sm sm:text-lg truncate max-w-full">
            {oppUserName || "Opponent"}
          </span>
          {mySymbol && (
            <span className="text-xs sm:text-sm text-gray-400">
              ({mySymbol === "X" ? "O" : "X"})
            </span>
          )}
        </div>
      </div>

      {/* Turn / Timer */}
      {!gameOver && (
        <div className="flex flex-col items-center gap-y-1">
          <p className="text-white text-base sm:text-xl font-semibold text-center">
            {Object.keys(gameState.players).length < 2
              ? "⏳ Waiting for opponent..."
              : isMyTurn
              ? "🟢 Your turn"
              : "⏳ Opponent's turn"}
          </p>
          {Object.keys(gameState.players).length === 2 &&
            gameMode === "timed" && (
              <div
                className={`text-2xl sm:text-3xl font-mono font-bold ${
                  timeLeft <= 5
                    ? "text-red-500 animate-pulse"
                    : "text-yellow-400"
                }`}
              >
                00:{timeLeft.toString().padStart(2, "0")}
              </div>
            )}
        </div>
      )}

      {/* Game over banner */}
      {gameOver && (
        <p className="text-xl sm:text-3xl font-bold text-white text-center">
          {gameOver.draw ? "🤝 It's a draw!" : didIWin ? "🎉 You won!" : "😔 You lost."}
        </p>
      )}

      {/* Board — scales gracefully on all screen sizes */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-[280px] sm:max-w-xs md:max-w-sm">
        {gameState.board.map((cell, index) => (
          <div
            key={index}
            className={`
              aspect-square bg-gray-700 rounded-md flex items-center justify-center
              text-3xl sm:text-4xl font-bold transition-colors
              ${cell === "X" ? "text-green-400" : "text-red-400"}
              ${
                !cell &&
                isMyTurn &&
                !gameOver &&
                Object.keys(gameState.players).length === 2
                  ? "cursor-pointer hover:bg-gray-600 active:bg-gray-500"
                  : "cursor-default"
              }
            `}
            onClick={() => handleMove(index)}
          >
            {cell}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamePage;