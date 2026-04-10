import { useEffect, useState } from "react";
import { useNakama } from "../context/NakamaContext";
import { useNavigate } from "react-router-dom";

const RoomBrowser = () => {
    const {client, session, socket, setMatchId} = useNakama()
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"timed" | "classic">("classic")
    const navigate = useNavigate();

    useEffect(() => {
        const getActiveRoom = async () =>{
            try {
                setLoading(true);
                const activeRooms = await client.listMatches(session,10,true,'',0,1,"+label.name:tic-tac-toe");
                setRooms(activeRooms.matches || []);
                console.log(activeRooms);
            } catch (error) {
                console.error("Error fetching rooms:", error);
            } finally {
                setLoading(false);
            }
        }
        getActiveRoom();

        const interval = setInterval(getActiveRoom,5000);

        return () => clearInterval(interval)
    },[]);

    const handleCreateMatch = async () => {
        try {
            const rpcResult = await client.rpc(session, "create_match", JSON.stringify({mode: mode}));
            console.log("Match created:", rpcResult);
            const {matchId} = rpcResult.payload;          
            console.log("Match Id", matchId);
            await socket.joinMatch(matchId);
            setMatchId(matchId)
            navigate('/game')
        } catch (error) {
            console.error("Error creating match:", error);
        }
    }

    const handleJoinMatch = async (match: any) => {
        try {
            console.log(match);
            await socket.joinMatch(match.match_id);
            setMatchId(match.match_id)
            navigate('/game')
        } catch (error) {
            console.error("Error joining match:", error);
        }
    }

    return (
        <div className="w-full items-center justify-center flex flex-col">
            <h1 className="text-4xl font-bold text-white mb-8">Active Rooms</h1>
            {loading && <p>Scanning games for you...</p>}
            {!loading && rooms.length === 0 && <p className="text-gray-400 italic">No active games found. Be the first to host a game!</p>}
            {!loading && rooms.length > 0 && (
                <ul className="space-y-4">
                    {rooms.map((room: any) => {
                        let roomMode = "classic";
                        try {
                            const parsedLabel = JSON.parse(room.label);
                            roomMode = parsedLabel.mode;
                        } catch(e) {}

                        return (
                            <li key={room.match_id} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg space-x-3">
                                <div className="space-x-3 flex flex-col items-start space-y-2">
                                    <span className="text-white font-semibold block">Tic-Tac-Toe Arena</span> 
                                    <span className="text-gray-400 text-sm">Players: {room.size}/2</span>
                                    
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${roomMode === 'timed' ? 'bg-blue-900 text-blue-300' : 'bg-gray-600 text-gray-200'}`}>
                                        {roomMode === 'timed' ? '⏱️ Timed' : '☕ Classic'}
                                    </span>
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold transition-colors" onClick={() => handleJoinMatch(room)}>Join Game</button>
                            </li>
                        )
                    })}
                </ul>
            )}
            <div className="flex flex-col items-center justify-center border border-gray-600 rounded-lg p-4 my-8">
                <h3 className="text-xl font-bold text-white mb-8">Choose Game Mode</h3>
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                    onClick={() => setMode("timed")}
                    className={`flex-1 py-2 rounded-md font-bold transition-all ${mode === "timed" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
                    >
                    ⏱️ Timed (30s)
                    </button>
                    <button 
                    onClick={() => setMode("classic")}
                    className={`flex-1 py-2 rounded-md font-bold transition-all ${mode === "classic" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
                    >
                    ☕ Classic
                    </button>
                </div>
                <button className="bg-green-700 hover:bg-green-500 rounded-lg text-white px-4 py-2 my-8 font-bold transition-colors capitalize" onClick={handleCreateMatch}>+ Host New {mode.toUpperCase()} Game</button>
            </div>
        </div>
    );
}

export default RoomBrowser;