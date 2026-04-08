import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNakama } from "../context/NakamaContext";

const Match = ({socket}: {socket: any}) => {
    const {setMatchTicket, setOpponent, session, setMatchId} = useNakama()

    const [ticket, setTicket] = useState<string | null>(null);
    const navigate = useNavigate()

  useEffect(() => {
    if (!socket) return;

    socket.onmatchmakermatched = async (matched: any) => {
      console.log("Match found!", matched);
      setTicket(null); 
      const opponent = matched.users.find((user: any) => user.presence.user_id !== session.user_id);
      setOpponent(opponent);
      
      const match = await socket.joinMatch(matched.match_id || null, matched.token || null);
      setMatchId(match.match_id);
      navigate('/game');
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
      const query = "*";
      const result = await socket.addMatchmaker(query, 2, 2);
      setTicket(result.ticket);
      setMatchTicket(result.ticket);
    }
  };

  return (
    <button onClick={toggleMatchmaking} className="px-4 py-2 rounded-lg bg-green-700">
      {ticket ? "Searching... (Click to Cancel)" : "Find Match"}
    </button>
  );
}

export default Match