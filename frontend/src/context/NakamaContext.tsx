import { Client } from "@heroiclabs/nakama-js";
import { createContext, useContext, useState, type ReactNode } from "react";



const client = new Client(import.meta.env.VITE_NAKAMA_SERVERKEY, import.meta.env.VITE_BACKEND_IP, import.meta.env.VITE_BACKEND_PORT, import.meta.env.VITE_NAKAMA_USE_SSL === "true");
const NakamaContext = createContext<any>(null);

const NakamaProvider = ({children}: {children: ReactNode}) => {
    const [session, setSession]       = useState(null);
    const [socket, setSocket]         = useState(null);
    const [username, setUsername]     = useState(null);
    const [matchTicket, setMatchTicket] = useState(null);
    const [opponent, setOpponent]     = useState(null);
    const [matchId, setMatchId]       = useState(null); 

    return (
        <NakamaContext.Provider value={{
            session, client, socket, setSession, setSocket,
            username, setUsername,
            matchTicket, setMatchTicket,
            opponent, setOpponent,
            matchId, setMatchId  
        }}>
            {children}
        </NakamaContext.Provider>
    )
}

export const useNakama = () => {
  const context = useContext(NakamaContext);
  if (!context) throw new Error("useNakama must be used inside NakamaProvider");
  return context;
};

export default NakamaProvider;