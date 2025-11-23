import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import OrderPage from './pages/OrderPage';
import KitchenDisplay from './pages/KitchenDisplay';
import ServerDashboard from './pages/ServerDashboard';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/order/:tableId" element={<OrderPage />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/server" element={<ServerDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
