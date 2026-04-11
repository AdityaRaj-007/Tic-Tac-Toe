import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNakama } from "../context/NakamaContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { client, setSession, setSocket, setUsername } = useNakama();

  const handleLogin = async () => {
    try {
      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("deviceId", deviceId);
      }
      const session = await client.authenticateDevice(deviceId, true, userName);
      await client.updateAccount(session, { display_name: userName });
      localStorage.setItem("user_id", session.user_id);
      localStorage.setItem("token", session.token);
      const useSSL = import.meta.env.VITE_NAKAMA_USE_SSL === "true";
      const socket = client.createSocket(useSSL);
      await socket.connect(session, true);
      setSession(session);
      setSocket(socket);
      setUsername(userName);
      setUserName("");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex justify-center flex-col items-center min-h-screen gap-y-6 bg-gray-900 px-4">
      <div className="flex flex-col items-center gap-y-2">
        <span className="text-5xl sm:text-6xl">✕ ○</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Tic Tac Toe
        </h1>
        <p className="text-gray-400 text-sm sm:text-base text-center">
          Enter a username to jump in
        </p>
      </div>

      <div className="w-full max-w-xs sm:max-w-sm flex flex-col gap-y-4">
        <div className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700 focus-within:border-green-500 transition-colors">
          <input
            type="text"
            placeholder="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-transparent text-white font-semibold outline-none placeholder-gray-500 text-base sm:text-lg text-center"
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={!userName.trim()}
          className="w-full bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-white font-bold text-base sm:text-lg transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

export default LoginPage;