import Dashboard from './pages/Dashboard'
import GamePage from './pages/GamePage'
import LoginPage from './pages/LoginPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'


const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage/>}/>
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/game" element={<GamePage/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App