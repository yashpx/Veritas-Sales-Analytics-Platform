import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerKPIView from './pages/ManagerKPIView';
import SalesRepKPIView from './pages/SalesRepKPIView';
import SalesReps from './pages/SalesReps';
import Customers from './pages/Customers';
import Calls from './pages/Calls';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/dashboard" element={<ManagerDashboard />} />
            <Route path="/analytics" element={<ManagerKPIView />} />
            <Route path="/sales-reps" element={<SalesReps />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;