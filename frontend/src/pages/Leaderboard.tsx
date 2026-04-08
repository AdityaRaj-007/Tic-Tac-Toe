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

const LeaderboardPage = () => {
  const { client, session } = useNakama();
  const [records, setRecords] = useState<FormattedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!client || !session) return;

      try {
        const result = await client.listLeaderboardRecords(session, "match_stats_v4", [], 50);

        if (result.records) {
          const formatted = result.records.map((record: any, index: number) => ({
            rank: index + 1, 
            username: record.username || "Unknown Player",
            score: parseInt(record.score, 10) || 0, 
            stats: (record.metadata as MatchStatsMetadata) || { win: 0, draw: 0, loss: 0 },
          }));
          
          setRecords(formatted);
          console.log(formatted);
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
      <div className="dark:bg-gray-900 h-screen flex items-center justify-center text-white text-xl">
        Loading Leaderboard...
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-900 min-h-screen flex flex-col items-center py-12 px-4">
      <h1 className="text-4xl font-bold text-white mb-8">Global Leaderboard</h1>

      <div className="w-full max-w-3xl bg-gray-800 rounded-lg shadow-xl overflow-hidden">
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
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No records found. Play a game to get on the board!
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr 
                  key={record.rank} 
                  className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                    record.username === session?.username ? "bg-gray-700 font-bold" : ""
                  }`}
                >
                  <td className="px-6 py-4 text-center text-xl font-bold">
                    #{record.rank}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {record.username}
                  </td>
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
      <button className="text-2xl font-bold text-white px-4 py-2 bg-green-700 rounded-lg mt-8" onClick={() => navigate("/dashboard")}>
                Play Again
            </button>
    </div>
  );
};

export default LeaderboardPage;