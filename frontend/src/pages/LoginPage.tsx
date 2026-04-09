import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNakama } from "../context/NakamaContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [userName, setUserName] = useState("");
  
  const navigate = useNavigate();

  const {client, setSession, setSocket, setUsername} = useNakama()

  const handleLogin = async () => {
    try {
      let deviceId = localStorage.getItem("deviceId");

      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("deviceId", deviceId);
      }

      const session = await client.authenticateDevice(deviceId, true, userName);

    await client.updateAccount(session, {
      display_name: userName
    });

      localStorage.setItem("user_id", session.user_id);
      localStorage.setItem("token", session.token);

      const useSSL = import.meta.env.VITE_NAKAMA_USE_SSL === "true";
      const socket = client.createSocket(useSSL);
      await socket.connect(session, true);

      console.log("Connected!", socket);
      setSession(session);
      setSocket(socket);
      setUsername(userName);

      setUserName("")
      navigate("/dashboard");

    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex justify-center flex-col items-center h-screen gap-y-4 bg-gray-900">
        <h1 className="text-2xl font-bold text-white mb-4">Tic Tac Toe</h1>
      <div className="dark:bg-gray-800 px-8 py-4 text-white border-t-1 border-b-1 border-white">
        <input
          type="text"
          placeholder="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="px-4 py-2 text-center bg-gray-600 text-white font-bold outline-none"
        />
      </div>

      <button
        onClick={handleLogin}
        className="bg-green-700 px-4 py-2 rounded-lg text-white"
      >
        Continue
      </button>
    </div>
  );
};

export default LoginPage;