import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Member } from './types';
import { UserContext, getStoredUser, setStoredUser } from './store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import BoardPage from './pages/BoardPage';
import DashboardPage from './pages/DashboardPage';
import TeamPage from './pages/TeamPage';

export default function App() {
  const [user, setUserState] = useState<Member | null>(getStoredUser);

  const setUser = (u: Member | null) => {
    setStoredUser(u);
    setUserState(u);
  };

  return (
    <UserContext value={{ user, setUser }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/board" replace /> : <LoginPage />} />
          <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
            <Route path="/board" element={<BoardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/team" element={<TeamPage />} />
          </Route>
          <Route path="*" element={<Navigate to={user ? '/board' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>
    </UserContext>
  );
}
