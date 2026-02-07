import React, { useState } from 'react';
import { UserRole } from '../types';
import { dataService } from '../services/dataService';
import Button from '../components/Button';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
        const user = dataService.login(username, password);
        setLoading(false);
        
        if (user) {
            onLoginSuccess();
        } else {
            setError('Invalid username or password');
        }
    }, 800);
  };

  const fillCredentials = (user: string, pass: string) => {
      setUsername(user);
      setPassword(pass);
      setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
       <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
           <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">E</div>
              <h1 className="text-3xl font-bold text-gray-800">EduTrack AI</h1>
              <p className="text-gray-500 mt-2">NoSQL-Powered Smart College System</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-5">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
              </div>

              {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

              <Button type="submit" className="w-full py-3" isLoading={loading}>
                 Login Securely
              </Button>
           </form>

           {/* Demo Credentials Helper */}
           <div className="mt-8 border-t pt-6">
              <p className="text-xs text-center text-gray-500 uppercase font-semibold mb-3">Quick Demo Login</p>
              <div className="grid grid-cols-3 gap-2">
                 <button onClick={() => fillCredentials('admin', 'password')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors">
                    Admin
                 </button>
                 <button onClick={() => fillCredentials('teacher', 'password')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors">
                    Teacher
                 </button>
                 <button onClick={() => fillCredentials('student', 'password')} className="text-xs py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors">
                    Student
                 </button>
              </div>
           </div>
           
           <div className="mt-6 text-center text-xs text-gray-400">
              © 2024 College System • Powered by Gemini AI
           </div>
       </div>
    </div>
  );
};

export default Login;