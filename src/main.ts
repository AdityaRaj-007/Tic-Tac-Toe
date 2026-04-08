function rpcCreateMatch(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const matchId = nk.matchCreate("tic-tac-toe", {});
  return JSON.stringify({ matchId });
}


function matchmakerMatchedHook(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  matches: nkruntime.MatchmakerResult[]
): string {
  logger.info("Matchmaker matched! Routing players to authoritative server...");
  
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
  
  initializer.registerMatchmakerMatched(matchmakerMatchedHook);
  nk.leaderboardCreate("match_stats_v4",false,nkruntime.SortOrder.DESCENDING,nkruntime.Operator.SET);

  logger.info("Module loaded");
}