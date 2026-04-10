import { useNakama } from "../context/NakamaContext";
import Match from "./Match";
import RoomBrowser from "./RoomBrowser";

const Dashboard = () => {
    const {socket} = useNakama(); 
    return (
        <div className="dark:bg-gray-900 min-h-screen text-white scroll-y-auto">
            <h1 className="px-4 py-2 w-screen border-b-1 text-2xl font-bold">Lobby</h1>
            <div className="flex flex-col items-center justify-between h-full mt-10">
                <RoomBrowser />
                <Match socket={socket}/>
                {/* <h3 className="text-xl font-bold">Available Matches</h3>
                {matches.map((match,index) => {
                    return (<div key={index}>
                        <p>Match ID: {match.matchId}</p>
                        <button>Join</button>
                    </div>)
                })} */}
            </div>
        </div>
    )
}

export default Dashboard