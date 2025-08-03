import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import History from './pages/History'; // Keep this for backend integration later
import Assistant from './pages/Assistant';

const App = () => {
  return (
    <Router>
      {/* Page Content */}
      <main className="bg-gray-100 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/assistant" element={<Assistant />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
