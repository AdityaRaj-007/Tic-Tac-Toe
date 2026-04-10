function rpcCreateMatch(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  let params = {mode: "classic"};

  try {
    let parsed = JSON.parse(payload);

    if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
    }
    
    if (parsed.mode === "timed") {
      params.mode = "timed";
    }
  } catch (error) {
    logger.error("Error parsing payload: %s", error);
  }

  const matchId = nk.matchCreate("tic-tac-toe", params);
  return JSON.stringify({ matchId });
}

function matchmakerMatchedHook(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  matches: nkruntime.MatchmakerResult[]
): string {
  let mode = "classic";

  if (matches[0].properties && matches[0].properties["mode"]) {
    mode = matches[0].properties["mode"];
  }
  logger.info("Matchmaker matched! Routing players to authoritative server...");
  
  const matchId = nk.matchCreate("tic-tac-toe", {mode: mode});
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