const TICK_RATE = 5;
const TURN_TIMEOUT_SEC = 30;
const MAX_EMPTY_SEC = 60;

interface GameState {
  board: string[];
  players: { [userId: string]: string };
  presences: { [userId: string]: nkruntime.Presence };
  currentTurn: string;
  winner: string | null;
  gameOver: boolean;
  open: boolean;
  dealineRemaningTicks: number;
  emptyTicks: number;
  mode: string;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6],            // Diagonals
];

const OP_CODES = {
  GAME_STATE: 1,
  MAKE_MOVE: 2,
  GAME_OVER: 3,  
  GET_STATE: 4,
  REJECTED: 5
};

const checkWin = (board: string[]): boolean => {
  return WINNING_COMBINATIONS.some(
    ([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]
  );
};

const checkForDraw = (board: string[]): boolean => {
  return board.every((cell) => cell !== "");
};

const matchInit: nkruntime.MatchInitFunction<GameState> = (
  ctx,
  logger,
  nk,
  params
) => {
  const mode = params && params.mode === "timed" ? "timed" : "classic";
  const state: GameState = {
    board: ["", "", "", "", "", "", "", "", ""],
    players: {},
    presences: {},
    currentTurn: "",
    winner: null,
    gameOver: false,
    open: true,
    dealineRemaningTicks: 0,
    emptyTicks: 0,
    mode: mode
  };

  const matchLabel = JSON.stringify({
    name: "tic-tac-toe",
    mode: mode
  });

  return {
    state,
    tickRate: TICK_RATE,
    label: matchLabel,
  };
};

const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction<GameState> = (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  presence
) => {
  if (!state.open || Object.keys(state.players).length >= 2) {
    return { state, accept: false, rejectMessage: "Match is full" };
  }
  return { state, accept: true };
};

const matchJoin: nkruntime.MatchJoinFunction<GameState> = (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  presences
) => {
  for (const presence of presences) {
    state.emptyTicks = 0;
    state.presences[presence.userId] = presence;

    if (!state.players[presence.userId]) {
      const symbol = Object.keys(state.players).length === 0 ? "X" : "O";
      state.players[presence.userId] = symbol;
    }
  }

  // Start game when 2 players join
  if (Object.keys(state.players).length === 2 && !state.currentTurn) {
    const playerIds = Object.keys(state.players);

    const randomIndex = Math.floor(Math.random() * playerIds.length)
    state.currentTurn = playerIds[randomIndex];

    state.dealineRemaningTicks = TURN_TIMEOUT_SEC*TICK_RATE;

    state.open = false;

    dispatcher.broadcastMessage(
      OP_CODES.GAME_STATE,
      JSON.stringify({
        currentTurn: state.currentTurn,
        board: state.board,
        players: state.players,
        deadlineRemaining: TURN_TIMEOUT_SEC,
        mode: state.mode
      })
    );
  }

  return { state };
};

const matchLeave: nkruntime.MatchLeaveFunction<GameState> = (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  presences
) => {
  if (state.gameOver) return { state };

  for (const presence of presences) {
    delete state.players[presence.userId];
    delete state.presences[presence.userId];

    const leftUserId = presence.userId;

    // logger.info("Loser: %s", leftUserId);

    const loserResult = nk.leaderboardRecordsList("match_stats_v4", [leftUserId], 1);
    // logger.info("Loser record: %s", loserResult);
    let loserStats = { win: 0, draw: 0, loss: 0 };
    
    if (loserResult.ownerRecords && loserResult.ownerRecords.length > 0 && loserResult.ownerRecords[0].ownerId === leftUserId && loserResult.ownerRecords[0].metadata) {
      // logger.info("Loser stats: %s", loserResult.ownerRecords[0].metadata);
      const meta = loserResult.ownerRecords[0].metadata as { win?: number; draw?: number; loss?: number };
      // logger.info("Loser metadata: %s", meta);
      loserStats = { win: meta.win || 0, draw: meta.draw || 0, loss: meta.loss || 0 };
      // logger.info("Loser stats: %s", loserStats);
    }
    loserStats.loss += 1;
    // logger.info("After updating loser stats: %s", loserStats);
    const loserNewScore = (loserStats.win * 2) + loserStats.draw;
    const loserSubScore = loserStats.win + loserStats.draw + loserStats.loss;
    
    const loserName = state.presences[leftUserId]?.username || "Unknown";
    nk.leaderboardRecordWrite("match_stats_v4", leftUserId, loserName, loserNewScore, loserSubScore, loserStats);
    // const loserResultAfterUpdating = nk.leaderboardRecordsList("match_stats_v4", [leftUserId], 1);
    // logger.info("Loser record after updating: %s", loserResultAfterUpdating);

    // If someone leaves mid-game, the remaining player automatically wins
    const remainingPlayerIds = Object.keys(state.players);
    if (remainingPlayerIds.length > 0) {
      state.winner = remainingPlayerIds[0];
      state.gameOver = true;

      dispatcher.broadcastMessage(
        OP_CODES.GAME_OVER,
        JSON.stringify({
          winner: state.winner,
          draw: false,
          board: state.board,
          reason: "opponent_disconnected"
        })
      );

      const sender = state.winner;


      const winnerResult = nk.leaderboardRecordsList("match_stats_v4", [sender], 1);
        // logger.info("Winner record: %s", winnerResult);
        let winnerStats = { win: 0, draw: 0, loss: 0 };
        
        if (winnerResult.ownerRecords && winnerResult.ownerRecords.length > 0 && winnerResult.ownerRecords[0].ownerId === sender && winnerResult.ownerRecords[0].metadata) {
          // logger.info("Winner stats: %s", winnerResult.ownerRecords[0].metadata);
          const meta = winnerResult.ownerRecords[0].metadata as { win?: number; draw?: number; loss?: number };
          // logger.info("Winner metadata: %s", meta);
          winnerStats = { win: meta.win || 0, draw: meta.draw || 0, loss: meta.loss || 0 };
          // logger.info("Winner stats: %s", winnerStats);
        }
        winnerStats.win += 1;
        const winnerNewScore = (winnerStats.win * 2) + winnerStats.draw;
        const winnerSubScore = winnerStats.win + winnerStats.draw + winnerStats.loss;

        const winnerName = state.presences[sender]?.username || "Unknown";
        nk.leaderboardRecordWrite("match_stats_v4", sender, winnerName, winnerNewScore, winnerSubScore, winnerStats);
    }
  }
  return { state };
};

const matchLoop: nkruntime.MatchLoopFunction<GameState> = (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  messages
) => {
  if(Object.keys(state.players).length === 0) {
    state.emptyTicks++;
    if(state.emptyTicks >= MAX_EMPTY_SEC*TICK_RATE) {
      return null;
    }
  }

  if (state.gameOver) return { state };

  if(state.currentTurn !== "" && state.mode === "timed") {
    state.dealineRemaningTicks--;

    if(state.dealineRemaningTicks <= 0) {
      state.gameOver = true;

      const playerIds = Object.keys(state.players);
      const winnerId = playerIds[0] === state.currentTurn ? playerIds[1] : playerIds[0];
      const loserId = state.currentTurn;

      state.winner = winnerId;

      dispatcher.broadcastMessage(
        OP_CODES.GAME_OVER,
        JSON.stringify({
          winner: state.winner,
          draw: false,
          board: state.board,
          reason: "timeout"
        })
      );

      const winnerResult = nk.leaderboardRecordsList("match_stats_v4", [winnerId], 1);
      let winnerStats = { win: 0, draw: 0, loss: 0 };
      if (winnerResult.ownerRecords && winnerResult.ownerRecords.length > 0 && winnerResult.ownerRecords[0].metadata) {
        const meta = winnerResult.ownerRecords[0].metadata as { win?: number; draw?: number; loss?: number };
        winnerStats = { win: meta.win || 0, draw: meta.draw || 0, loss: meta.loss || 0 };
      }
      winnerStats.win += 1;
      const winnerNewScore = (winnerStats.win * 2) + winnerStats.draw;
      const winnerSubScore = winnerStats.win + winnerStats.draw + winnerStats.loss;
      const winnerName = state.presences[winnerId]?.username || "Unknown";
      nk.leaderboardRecordWrite("match_stats_v4", winnerId, winnerName, winnerNewScore, winnerSubScore, winnerStats);

      // ✅ Update Loser Stats for Timeout
      const loserResult = nk.leaderboardRecordsList("match_stats_v4", [loserId], 1);
      let loserStats = { win: 0, draw: 0, loss: 0 };
      if (loserResult.ownerRecords && loserResult.ownerRecords.length > 0 && loserResult.ownerRecords[0].metadata) {
        const meta = loserResult.ownerRecords[0].metadata as { win?: number; draw?: number; loss?: number };
        loserStats = { win: meta.win || 0, draw: meta.draw || 0, loss: meta.loss || 0 };
      }
      loserStats.loss += 1;
      const loserNewScore = (loserStats.win * 2) + loserStats.draw;
      const loserSubScore = loserStats.win + loserStats.draw + loserStats.loss;
      const loserName = state.presences[loserId]?.username || "Unknown";
      nk.leaderboardRecordWrite("match_stats_v4", loserId, loserName, loserNewScore, loserSubScore, loserStats);

      // ✅ CRITICAL: Stop processing messages because the game is over!
      return { state };
    }
  }

  for (const message of messages) {
    if (message.opCode === OP_CODES.GET_STATE) {
      dispatcher.broadcastMessage(
        OP_CODES.GAME_STATE,
        JSON.stringify({
          currentTurn: state.currentTurn,
          board: state.board,
          players: state.players,
          mode: state.mode
        }),
        [message.sender] 
      );
      continue; 
    }

    if (message.opCode === OP_CODES.MAKE_MOVE) {
      let data: any;
      try {
        data = JSON.parse(nk.binaryToString(message.data));
      } catch {
        continue;
      }

      const { cellIndex } = data;
      const sender = message.sender.userId;

      if (typeof cellIndex !== "number" || cellIndex < 0 || cellIndex > 8) continue;
      if (state.currentTurn !== sender) continue;
      if (state.board[cellIndex] !== "") continue;

      state.board[cellIndex] = state.players[sender];

      // Check Win
      if (checkWin(state.board)) {
        state.winner = sender;
        state.gameOver = true;
        dispatcher.broadcastMessage(
          OP_CODES.GAME_OVER,
          JSON.stringify({ winner: sender, draw: false, board: state.board })
        );

        logger.info("Winner: %s", sender);

        // for winner update
        const winnerResult = nk.leaderboardRecordsList("match_stats_v4", [sender], 1);
        logger.info("Winner record: %s", winnerResult);
        let winnerStats = { win: 0, draw: 0, loss: 0 };
        
        if (winnerResult.ownerRecords && winnerResult.ownerRecords.length > 0 && winnerResult.ownerRecords[0].ownerId === sender && winnerResult.ownerRecords[0].metadata) {
          logger.info("Winner stats: %s", winnerResult.ownerRecords[0].metadata);
          const meta = winnerResult.ownerRecords[0].metadata as { win?: number; draw?: number; loss?: number };
          logger.info("Winner metadata: %s", meta);
          winnerStats = { win: meta.win || 0, draw: meta.draw || 0, loss: meta.loss || 0 };
          logger.info("Winner stats: %s", winnerStats);
        }
        winnerStats.win += 1;
        const winnerNewScore = (winnerStats.win * 2) + winnerStats.draw;
        const winnerSubScore = winnerStats.win + winnerStats.draw + winnerStats.loss;

        const winnerName = state.presences[sender]?.username || "Unknown";
        nk.leaderboardRecordWrite("match_stats_v4", sender, winnerName, winnerNewScore, winnerSubScore, winnerStats);


        // for looser update
        const playerIds = Object.keys(state.players);
        const opponentId = playerIds[0] === sender ? playerIds[1] : playerIds[0]; 

        logger.info("Loser: %s", opponentId);

        const loserResult = nk.leaderboardRecordsList("match_stats_v4", [opponentId], 1);
        logger.info("Loser record: %s", loserResult);
        let loserStats = { win: 0, draw: 0, loss: 0 };
        
        if (loserResult.ownerRecords && loserResult.ownerRecords.length > 0 && loserResult.ownerRecords[0].ownerId === opponentId && loserResult.ownerRecords[0].metadata) {
          logger.info("Loser stats: %s", loserResult.ownerRecords[0].metadata);
          const meta = loserResult.ownerRecords[0].metadata as { win?: number; draw?: number; loss?: number };
          logger.info("Loser metadata: %s", meta);
          loserStats = { win: meta.win || 0, draw: meta.draw || 0, loss: meta.loss || 0 };
          logger.info("Loser stats: %s", loserStats);
        }
        loserStats.loss += 1;
        logger.info("After updating loser stats: %s", loserStats);
        const loserNewScore = (loserStats.win * 2) + loserStats.draw;
        const loserSubScore = loserStats.win + loserStats.draw + loserStats.loss;
        
        const loserName = state.presences[opponentId]?.username || "Unknown";
        nk.leaderboardRecordWrite("match_stats_v4", opponentId, loserName, loserNewScore, loserSubScore, loserStats);
        const loserResultAfterUpdating = nk.leaderboardRecordsList("match_stats_v4", [opponentId], 1);
        logger.info("Loser record after updating: %s", loserResultAfterUpdating);

        return { state };
      }

      // Check Draw
      if (checkForDraw(state.board)) {
        state.gameOver = true;
        dispatcher.broadcastMessage(
          OP_CODES.GAME_OVER,
          JSON.stringify({ winner: null, draw: true, board: state.board })
        );

        // updating for both users
        const playerIds = Object.keys(state.players);
        
        for (const playerId of playerIds) {
          const username = state.presences[playerId].username;
          const result = nk.leaderboardRecordsList("match_stats_v4", [playerId], 1);
          let stats = { win: 0, draw: 0, loss: 0 };
          
          if (result.ownerRecords && result.ownerRecords.length > 0 && result.ownerRecords[0].ownerId === playerId && result.ownerRecords[0].metadata) {
            const meta = result.ownerRecords[0].metadata as { win?: number; draw?: number; loss?: number };
            stats = { win: meta.win || 0, draw: meta.draw || 0, loss: meta.loss || 0 };
          }
          
          stats.draw += 1;

          const newScore = stats.win*2 + stats.draw;
          const newSubScore = stats.win + stats.draw + stats.loss;


          nk.leaderboardRecordWrite(
            "match_stats_v4", playerId, username, newScore, newSubScore, stats
          );
        }

        return { state };
      }

      // Switch turn
      const playerIds = Object.keys(state.players);
      state.currentTurn = playerIds[0] === sender ? playerIds[1] : playerIds[0];
      state.dealineRemaningTicks = TURN_TIMEOUT_SEC * TICK_RATE;

      dispatcher.broadcastMessage(
        OP_CODES.GAME_STATE,
        JSON.stringify({
          currentTurn: state.currentTurn,
          board: state.board,
          players: state.players,
          deadlineRemaining: TURN_TIMEOUT_SEC,
          mode: state.mode
        })
      );
    }
  }

  return { state };
};

const matchSignal: nkruntime.MatchSignalFunction<GameState> = (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  data
) => {
  return { state, data };
};

const matchTerminate: nkruntime.MatchTerminateFunction<GameState> = (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state
) => {
  return { state };
};

const ticTacToeMatchHandler: nkruntime.MatchHandler<GameState> = {
  matchInit,
  matchJoinAttempt,
  matchJoin,
  matchLeave,
  matchLoop,
  matchSignal,
  matchTerminate,
};