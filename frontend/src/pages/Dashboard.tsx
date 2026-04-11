import { useNavigate } from "react-router-dom";
import { useNakama } from "../context/NakamaContext";
import Match from "./Match";
import RoomBrowser from "./RoomBrowser";

const Dashboard = () => {
    const { socket } = useNakama();
    const navigate = useNavigate();
    return (
        <div className="dark:bg-gray-900 min-h-screen text-white">
            <div className="w-full border-b border-gray-700 text-xl sm:text-2xl font-bold sticky top-0 bg-gray-900 z-10 flex justify-between items-center py-4">
                <h1 className="px-4 py-3">🎮 Lobby</h1>
                <button className="text-2xl font-bold text-white px-4 py-2 bg-green-700 rounded-lg mr-4" onClick={() => navigate("/leaderboard")}>Leaderboard</button>
            </div>
            <div className="flex flex-col items-center justify-between h-full mt-6 sm:mt-10 pb-8 px-4 gap-y-6 sm:gap-y-8 max-w-2xl mx-auto">
                <RoomBrowser />
                <Match socket={socket} />
            </div>
        </div>
    );
};

export default Dashboard;