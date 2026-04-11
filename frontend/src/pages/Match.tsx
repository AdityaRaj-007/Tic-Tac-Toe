import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNakama } from "../context/NakamaContext";

const Match = ({ socket }: { socket: any }) => {
    const { setMatchTicket, setOpponent, session, setMatchId } = useNakama();
    const [ticket, setTicket] = useState<string | null>(null);
    const [mode, setMode] = useState<"timed" | "classic">("classic");
    const navigate = useNavigate();

    useEffect(() => {
        if (!socket) return;

        socket.onmatchmakermatched = async (matched: any) => {
            setTicket(null);
            const opponent = matched.users.find(
                (user: any) => user.presence.user_id !== session.user_id
            );
            setOpponent(opponent);
            const match = await socket.joinMatch(
                matched.match_id || null,
                matched.token || null
            );
            setMatchId(match.match_id);
            navigate("/game");
        };

        return () => {
            if (ticket) {
                socket.removeMatchmaker(ticket).catch((_err: any) => {
                    console.log("Matchmaker ticket no longer active.");
                });
            }
        };
    }, [socket, ticket]);

    const toggleMatchmaking = async () => {
        if (ticket) {
            try {
                await socket.removeMatchmaker(ticket);
            } catch (_err: any) {
                console.log("Matchmaker ticket no longer active.");
            }
            setTicket(null);
        } else {
            const query = `+properties.mode:${mode}`;
            const result = await socket.addMatchmaker(query, 2, 2, { mode });
            setTicket(result.ticket);
            setMatchTicket(result.ticket);
        }
    };

    return (
        <div className="w-full flex flex-col gap-y-3">
            <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                    onClick={() => setMode("timed")}
                    className={`flex-1 py-2 sm:py-2.5 rounded-md font-bold text-sm sm:text-base transition-all ${
                        mode === "timed"
                            ? "bg-blue-600 text-white shadow"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    ⏱️ Timed (30s)
                </button>
                <button
                    onClick={() => setMode("classic")}
                    className={`flex-1 py-2 sm:py-2.5 rounded-md font-bold text-sm sm:text-base transition-all ${
                        mode === "classic"
                            ? "bg-blue-600 text-white shadow"
                            : "text-gray-400 hover:text-white"
                    }`}
                >
                    ☕ Classic
                </button>
            </div>
            <button
                onClick={toggleMatchmaking}
                className="w-full px-4 py-3 rounded-lg bg-green-700 hover:bg-green-500 transition-colors font-bold text-sm sm:text-base text-white"
            >
                {ticket
                    ? "🔍 Searching... (Tap to Cancel)"
                    : `▶ Play Random ${mode.toUpperCase()} Match`}
            </button>
        </div>
    );
};

export default Match;