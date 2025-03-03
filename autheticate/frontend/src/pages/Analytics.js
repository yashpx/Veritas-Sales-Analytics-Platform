import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Box, Avatar, CircularProgress, Paper, Typography
} from '@mui/material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    successRate: 0,
    revenuePerCall: 0,
    avgSatisfaction: 0,
    monthlyRevenueTrend: [],
    callEffectiveness: []
  });

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        
        // For demo purposes, using mock data
        // In production, you would fetch from your database
        
        const totalRevenue = 125000;
        const successRate = 68;
        const revenuePerCall = 380;
        const avgSatisfaction = 4.2;
        
        const monthlyRevenueTrend = [
          { month: 'Jan', total_revenue: 10500 },
          { month: 'Feb', total_revenue: 12200 },
          { month: 'Mar', total_revenue: 9800 },
          { month: 'Apr', total_revenue: 14500 },
          { month: 'May', total_revenue: 15800 },
          { month: 'Jun', total_revenue: 18500 },
        ];
        
        const callEffectiveness = [
          { month: 'Successful', call_effectiveness: 65 },
          { month: 'Pending', call_effectiveness: 25 },
          { month: 'Failed', call_effectiveness: 10 },
        ];
        
        setKpiData({
          totalRevenue,
          successRate,
          revenuePerCall,
          avgSatisfaction,
          monthlyRevenueTrend,
          callEffectiveness
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching KPIs:', error);
        setLoading(false);
      }
    };
    
    if (user) {
      fetchKPIs();
    }
  }, [user]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, color: 'var(--heading-color)' }}>
          Analytics Dashboard
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mt: 3 }}>
          <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#4CAF50', width: 60, height: 60, mr: 3 }}>
              <AttachMoneyIcon sx={{ fontSize: 35, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--primary-color)' }}>
                ${kpiData.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-color)' }}>Total Revenue</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#FF9800', width: 60, height: 60, mr: 3 }}>
              <ThumbUpIcon sx={{ fontSize: 35, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--primary-color)' }}>
                {kpiData.successRate}%
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-color)' }}>Success Rate</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <Avatar sx={{ bgcolor: '#2196F3', width: 60, height: 60, mr: 3 }}>
              <TrendingUpIcon sx={{ fontSize: 35, color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--primary-color)' }}>
                ${kpiData.revenuePerCall}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'var(--text-color)' }}>Revenue Per Call</Typography>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4, mt: 4 }}>
          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'var(--primary-color)' }}>Monthly Revenue Trend</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={kpiData.monthlyRevenueTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total_revenue" stroke="var(--primary-color)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.1)', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#FF9800' }}>Call Effectiveness</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={kpiData.callEffectiveness} 
                  dataKey="call_effectiveness" 
                  nameKey="month" 
                  outerRadius={80} 
                  fill="#FF9800"
                  label={(entry) => entry.month}
                >
                  {kpiData.callEffectiveness.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#4CAF50', '#FF9800', '#f44336'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default Analytics;