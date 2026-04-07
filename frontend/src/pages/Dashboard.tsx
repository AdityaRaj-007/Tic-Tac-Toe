import { useNakama } from "../context/NakamaContext";
import Match from "./Match";

const Dashboard = () => {
    const {socket} = useNakama(); 
    return (
        <div className="dark:bg-gray-900 h-screen text-white">
            <h1 className="px-4 py-2 w-screen border-b-1 text-2xl font-bold">Lobby</h1>
            <div className="flex flex-col items-center items-center justify-center h-full">
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