function rpcCreateMatch(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const matchId = nk.matchCreate("tic-tac-toe", {});
  return JSON.stringify({ matchId });
}

// ✅ 1. Add this Hook
function matchmakerMatchedHook(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  matches: nkruntime.MatchmakerResult[]
): string {
  logger.info("Matchmaker matched! Routing players to authoritative server...");
  
  // Creates an instance of our tic-tac-toe match and forces the matchmaker to use it
  const matchId = nk.matchCreate("tic-tac-toe", {});
  return matchId; 
}

function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  initializer.registerRpc("create_match", rpcCreateMatch); 
  initializer.registerMatch("tic-tac-toe", ticTacToeMatchHandler);
  
  // ✅ 2. Register the Hook
  initializer.registerMatchmakerMatched(matchmakerMatchedHook);

  logger.info("Module loaded");
}