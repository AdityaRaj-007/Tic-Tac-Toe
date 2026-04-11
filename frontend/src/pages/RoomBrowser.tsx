import { useEffect, useState } from "react";
import { useNakama } from "../context/NakamaContext";
import { useNavigate } from "react-router-dom";

const RoomBrowser = () => {
    const { client, session, socket, setMatchId } = useNakama();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"timed" | "classic">("classic");
    const navigate = useNavigate();

    useEffect(() => {
        const getActiveRoom = async () => {
            try {
                setLoading(true);
                const activeRooms = await client.listMatches(
                    session,
                    10,
                    true,
                    "",
                    0,
                    1,
                    "+label.name:tic-tac-toe"
                );
                setRooms(activeRooms.matches || []);
            } catch (error) {
                console.error("Error fetching rooms:", error);
            } finally {
                setLoading(false);
            }
        };
        getActiveRoom();
        const interval = setInterval(getActiveRoom, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateMatch = async () => {
        try {
            const rpcResult = await client.rpc(
                session,
                "create_match",
                JSON.stringify({ mode })
            );
            const { matchId } = rpcResult.payload;
            await socket.joinMatch(matchId);
            setMatchId(matchId);
            navigate("/game");
        } catch (error) {
            console.error("Error creating match:", error);
        }
    };

    const handleJoinMatch = async (match: any) => {
        try {
            await socket.joinMatch(match.match_id);
            setMatchId(match.match_id);
            navigate("/game");
        } catch (error) {
            console.error("Error joining match:", error);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 self-start">
                Active Rooms
            </h2>

            {loading && (
                <p className="text-gray-400 text-sm animate-pulse">
                    Scanning games for you...
                </p>
            )}
            {!loading && rooms.length === 0 && (
                <p className="text-gray-400 italic text-sm sm:text-base text-center px-4">
                    No active games found. Be the first to host!
                </p>
            )}
            {!loading && rooms.length > 0 && (
                <ul className="w-full space-y-3">
                    {rooms.map((room: any) => {
                        let roomMode = "classic";
                        try {
                            const parsedLabel = JSON.parse(room.label);
                            roomMode = parsedLabel.mode;
                        } catch (e) {}

                        return (
                            <li
                                key={room.match_id}
                                className="flex items-center justify-between bg-gray-800 p-3 sm:p-4 rounded-lg gap-x-3"
                            >
                                <div className="flex flex-col gap-y-1 min-w-0">
                                    <span className="text-white font-semibold text-sm sm:text-base truncate">
                                        Tic-Tac-Toe Arena
                                    </span>
                                    <span className="text-gray-400 text-xs sm:text-sm">
                                        Players: {room.size}/2
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase w-fit ${
                                            roomMode === "timed"
                                                ? "bg-blue-900 text-blue-300"
                                                : "bg-gray-600 text-gray-200"
                                        }`}
                                    >
                                        {roomMode === "timed" ? "⏱️ Timed" : "☕ Classic"}
                                    </span>
                                </div>
                                <button
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-4 py-2 rounded font-bold text-sm sm:text-base transition-colors shrink-0"
                                    onClick={() => handleJoinMatch(room)}
                                >
                                    Join
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Host section */}
            <div className="w-full flex flex-col items-center border border-gray-600 rounded-xl p-4 sm:p-6 mt-6 gap-y-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                    Host a New Game
                </h3>
                <div className="w-full flex bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setMode("timed")}
                        className={`flex-1 py-2 rounded-md font-bold text-sm sm:text-base transition-all ${
                            mode === "timed"
                                ? "bg-blue-600 text-white shadow"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        ⏱️ Timed (30s)
                    </button>
                    <button
                        onClick={() => setMode("classic")}
                        className={`flex-1 py-2 rounded-md font-bold text-sm sm:text-base transition-all ${
                            mode === "classic"
                                ? "bg-blue-600 text-white shadow"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        ☕ Classic
                    </button>
                </div>
                <button
                    className="w-full bg-green-700 hover:bg-green-500 rounded-lg text-white px-4 py-3 font-bold text-sm sm:text-base transition-colors capitalize"
                    onClick={handleCreateMatch}
                >
                    + Host {mode.toUpperCase()} Game
                </button>
            </div>
        </div>
    );
};

export default RoomBrowser;