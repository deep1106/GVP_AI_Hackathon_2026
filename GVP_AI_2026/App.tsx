import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Attendance from './pages/Attendance';
import Performance from './pages/Performance';
import Layout from './components/Layout';
import { User, UserRole, LanguageCode } from './types';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  useEffect(() => {
    // Check for existing session
    const currentUser = dataService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLoginSuccess = () => {
    const loggedInUser = dataService.getCurrentUser();
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    dataService.logout();
    setUser(null);
  };

  const renderPage = () => {
    if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} currentLang={currentLang} />;
      case 'students':
        return <Students user={user} currentLang={currentLang} />;
      case 'teachers':
        return <Teachers user={user} currentLang={currentLang} />;
      case 'attendance':
        return <Attendance user={user} currentLang={currentLang} />;
      case 'performance':
        return <Performance user={user} currentLang={currentLang} />;
      default:
        return <Dashboard user={user} currentLang={currentLang} />;
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentLang={currentLang} 
      onLangChange={setCurrentLang}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;