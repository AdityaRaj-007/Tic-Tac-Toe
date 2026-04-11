import { useEffect, useState } from "react";
import { useNakama } from "../context/NakamaContext";
import { useNavigate } from "react-router-dom";

interface MatchStatsMetadata {
  win?: number;
  draw?: number;
  loss?: number;
}

interface FormattedRecord {
  rank: number;
  username: string;
  score: number;
  stats: MatchStatsMetadata;
}

const rankEmoji = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const LeaderboardPage = () => {
  const { client, session } = useNakama();
  const [records, setRecords] = useState<FormattedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!client || !session) return;
      try {
        const result = await client.listLeaderboardRecords(
          session,
          "match_stats_v4",
          [],
          50
        );
        if (result.records) {
          const formatted = result.records.map(
            (record: any, index: number) => ({
              rank: index + 1,
              username: record.username || "Unknown Player",
              score: parseInt(record.score, 10) || 0,
              stats: (record.metadata as MatchStatsMetadata) || {
                win: 0,
                draw: 0,
                loss: 0,
              },
            })
          );
          setRecords(formatted);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [client, session]);

  if (loading) {
    return (
      <div className="dark:bg-gray-900 min-h-screen flex items-center justify-center text-white text-lg sm:text-xl px-4">
        Loading Leaderboard...
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-900 min-h-screen flex flex-col items-center py-8 sm:py-12 px-3 sm:px-4">
      <h1 className="text-2xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">
        🏆 Global Leaderboard
      </h1>

      {/* Desktop table — hidden on mobile */}
      <div className="hidden sm:block w-full max-w-3xl bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-gray-700 text-gray-400 uppercase text-sm">
            <tr>
              <th className="px-6 py-4 text-center">Rank</th>
              <th className="px-6 py-4">Player</th>
              <th className="px-6 py-4 text-center text-green-400">Wins</th>
              <th className="px-6 py-4 text-center text-gray-400">Draws</th>
              <th className="px-6 py-4 text-center text-red-400">Losses</th>
              <th className="px-6 py-4 text-right text-yellow-400">Score</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No records yet. Play a game to get on the board!
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.rank}
                  className={`border-b border-gray-700 transition-colors ${
                    record.username === session?.username
                      ? "bg-gray-700 font-bold"
                      : "hover:bg-gray-750"
                  }`}
                >
                  <td className="px-6 py-4 text-center text-xl font-bold">
                    {rankEmoji(record.rank)}
                  </td>
                  <td className="px-6 py-4 text-white">{record.username}</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    {record.stats.win || 0}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">
                    {record.stats.draw || 0}
                  </td>
                  <td className="px-6 py-4 text-center text-red-400">
                    {record.stats.loss || 0}
                  </td>
                  <td className="px-6 py-4 text-right text-2xl font-bold text-yellow-400">
                    {record.score}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list — shown only on small screens */}
      <div className="sm:hidden w-full max-w-md flex flex-col gap-y-3">
        {records.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">
            No records yet. Play a game to get on the board!
          </p>
        ) : (
          records.map((record) => (
            <div
              key={record.rank}
              className={`flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 border ${
                record.username === session?.username
                  ? "border-green-500"
                  : "border-gray-700"
              }`}
            >
              <div className="flex items-center gap-x-3">
                <span className="text-xl font-bold w-8 text-center">
                  {rankEmoji(record.rank)}
                </span>
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-sm truncate max-w-[130px]">
                    {record.username}
                    {record.username === session?.username && (
                      <span className="ml-1 text-xs text-green-400">(you)</span>
                    )}
                  </span>
                  <div className="flex gap-x-2 text-xs mt-0.5">
                    <span className="text-green-400">{record.stats.win || 0}W</span>
                    <span className="text-gray-400">{record.stats.draw || 0}D</span>
                    <span className="text-red-400">{record.stats.loss || 0}L</span>
                  </div>
                </div>
              </div>
              <span className="text-yellow-400 font-bold text-lg">
                {record.score}
              </span>
            </div>
          ))
        )}
      </div>

      <button
        className="mt-8 text-base sm:text-xl font-bold text-white px-6 py-3 bg-green-700 hover:bg-green-600 rounded-xl transition-colors"
        onClick={() => navigate("/dashboard")}
      >
        Play Again
      </button>
    </div>
  );
};

export default LeaderboardPage;