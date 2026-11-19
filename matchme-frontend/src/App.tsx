import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/protectedRoute";
import ProfileSetup from "./pages/ProfileSetup";
import MainPage from "./pages/MainPage";
import EditProfile from "./pages/EditProfile";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import Chat from "./pages/Chat";
import ViewProfile from "./pages/ViewProfile";
import UserProfile from "./pages/UserProfile";
import Connections from "./pages/Connections";

function App() {
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/ProfileSetup" element={<ProfileSetup />} />
            <Route path="/ProfileSetup" element={<ProfileSetup />} />
            <Route path="/MainPage" element={<MainPage />} />
            <Route path="/EditProfile" element={<EditProfile />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:chatId" element={<Chat />} />
            <Route path="/ViewProfile" element={<ViewProfile />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/connections" element={<Connections />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;
