import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/authPages/Signup';
import Signin from './pages/authPages/Signin';
import Chat from './pages/chatPage/Chat';
import LandingPage from './pages/landing/LandingPage';
import Pricing from './pages/premium/Pricing';
import DiaryPage from './pages/diaryPage/DiaryPage';
import ReinaPage from './pages/reinaPage/ReinaPage';
import { ActivityTrackerProvider } from './contexts/ActivityTrackerContext';


function App() {
  return (
    <ActivityTrackerProvider>
      <BrowserRouter>
        <Routes>

        {/* Default route → Signup */}
        <Route path="/signup" element={<Signup />} />
         <Route path="/" element={<LandingPage />} />
        {/* Login page */}
        <Route path="/signin" element={<Signin />} />

        {/* Protected Chat Page */}
        <Route path="/chat" element={<Chat />}/>
        <Route path="/diary" element={<DiaryPage />}/>
        <Route path="/reina" element={<ReinaPage />}/>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </BrowserRouter>
    </ActivityTrackerProvider>
  );
}

export default App;
