import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';

const App = () => {
  return (
    <Router>
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">AI Media Analyzer</h1>
        <div className="space-x-4">
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Home</Link>
          <Link to="/history" className="text-gray-700 hover:text-blue-600 transition">History</Link>
          <Link to="/settings" className="text-gray-700 hover:text-blue-600 transition">Settings</Link>
        </div>
      </nav>

      {/* Page Content */}
      <main className="bg-gray-100 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Optional Footer */}
      <footer className="text-center text-sm text-gray-500 p-4">
        &copy; {new Date().getFullYear()} AI Media Analyzer. All rights reserved.
      </footer>
    </Router>
  );
};

export default App;