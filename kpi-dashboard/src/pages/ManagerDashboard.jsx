import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Container, Grid, Paper, Typography, Box, Avatar, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, CircularProgress 
} from '@mui/material';
import './ManagerDashboard.css';

const supabaseUrl = 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';
const supabase = createClient(supabaseUrl, supabaseKey);

const ManagerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalCalls: 0,
    salesClosed: 0,
    callMinutes: 0,
    salesPending: 0,
    topSalesReps: [],
    recentCalls: [],
    monthlySales: 0,
    callSentiment: { positive: 30, negative: 45, neutral: 25 }
  });
  const [currentDate, setCurrentDate] = useState('');
  const [salesTrend, setSalesTrend] = useState([]);

  useEffect(() => {
    // Format current date
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    setCurrentDate(formattedDate);

    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get total calls (last 7 days)
      const year = 2025;
      const startOfWeek = new Date(year, 1, 1); // February 1st (static date set)
      const endOfWeek = new Date(year, 1, 7); // February 7th (static date set)

      const { data: callData, error: callError } = await supabase
          .from('call_logs')
          .select('call_id')
          .gte('call_date', startOfWeek.toISOString())
          .lt('call_date', endOfWeek.toISOString());
      
      if (callError) throw callError;
      
      // Get closed sales
      const { data: closedSales, error: salesError } = await supabase
        .from('call_logs')
        .select('call_id')
        .eq('call_outcome', 'Closed');
      
      if (salesError) throw salesError;
      
      // Get total call minutes
      const { data: minutesData, error: minutesError } = await supabase
          .from('call_logs')
          .select('duration_minutes')
          .gte('call_date', startOfWeek.toISOString())
          .lt('call_date', endOfWeek.toISOString());
      
      if (minutesError) throw minutesError;
      
      const totalMinutes = minutesData.reduce((sum, call) => sum + call.duration_minutes, 0);
      
      // Get pending sales (in-progress calls)
      const { data: pendingSales, error: pendingError } = await supabase
        .from('call_logs')
        .select('call_id')
        .eq('call_outcome', 'In-progress');
      
      if (pendingError) throw pendingError;
      
      // Get top sales reps
      const { data: salesReps, error: repsError } = await supabase
        .from('sales_data')
        .select(`
          sales_rep_id,
          sales_reps!inner(sales_rep_first_name, sales_rep_last_name),
          sale_amount
        `)
        .order('sale_date', { ascending: false })
        .limit(50);
      
      if (repsError) throw repsError;
      
      // Process sales rep data
      const currentMonth = new Date().getMonth();
      const processedReps = {};
      
      salesReps.forEach(sale => {
        const repId = sale.sales_rep_id;
        const firstName = sale.sales_reps.sales_rep_first_name;
        const lastName = sale.sales_reps.sales_rep_last_name;
        const fullName = `${firstName} ${lastName}`;
        
        if (!processedReps[repId]) {
          processedReps[repId] = {
            id: repId,
            name: fullName,
            month: 'Jan', // Using Jan as in the image
            deals: 0,
            totalSales: 0
          };
        }
        
        processedReps[repId].deals += 1;
        processedReps[repId].totalSales += Number(sale.sale_amount);
      });
      
      // Convert to array and sort by sales
      const topReps = Object.values(processedReps)
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5);
      
      // Get recent calls
      const { data: recentCallsData, error: recentCallsError } = await supabase
        .from('call_logs')
        .select(`
          call_id,
          call_date,
          duration_minutes,
          call_outcome,
          customers!inner(customer_first_name, customer_last_name),
          sales_reps!inner(sales_rep_first_name, sales_rep_last_name)
        `)
        .order('call_date', { ascending: false })
        .limit(5);
      
      if (recentCallsError) throw recentCallsError;
      
      const recentCalls = recentCallsData.map(call => ({
        date: new Date(call.call_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        client: `${call.customers.customer_first_name} ${call.customers.customer_last_name}`,
        salesRep: `${call.sales_reps.sales_rep_first_name} ${call.sales_reps.sales_rep_last_name}`,
        duration: `${call.duration_minutes}m`,
        outcome: call.call_outcome
      }));
      
      // Get monthly sales
      const currentYear = new Date().getFullYear();
      const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString();
      const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString();
      
      const { data: monthlySalesData, error: monthlySalesError } = await supabase
        .from('sales_data')
        .select('sale_amount')
        .gte('sale_date', currentMonthStart)
        .lte('sale_date', currentMonthEnd);
      
      if (monthlySalesError) throw monthlySalesError;
      
      const totalMonthlySales = monthlySalesData.reduce((sum, sale) => sum + Number(sale.sale_amount), 0);
      
      // Generate sales trend data (for the line chart)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      const trendData = last7Days.map(day => ({
        day: day.slice(8, 10),
        sales: Math.floor(Math.random() * 10 + 5) // Random data for visualization
      }));
      
      setSalesTrend(trendData);
      
      // Set all dashboard data
      setDashboardData({
        totalCalls: callData.length,
        salesClosed: closedSales.length,
        callMinutes: totalMinutes,
        salesPending: pendingSales.length,
        topSalesReps: topReps,
        recentCalls: recentCalls,
        monthlySales: Math.round(totalMonthlySales),
        callSentiment: { positive: 30, negative: 45, neutral: 25 } // Mock data as sentiment is not directly available
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // For the pie chart
  const COLORS = ['#4ADE80', '#FF6B6B', '#E2E8F0'];

  const renderSentimentPieChart = () => {
    const data = [
      { name: 'Positive', value: dashboardData.callSentiment.positive },
      { name: 'Negative', value: dashboardData.callSentiment.negative },
      { name: 'Neutral', value: dashboardData.callSentiment.neutral }
    ];

    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
            <tspan x="50%" dy="-10" fontSize="24" fontWeight="bold" fill="#000">
              {dashboardData.totalCalls}
            </tspan>
            <tspan x="50%" dy="25" fontSize="14" fill="#666">
              Calls made
            </tspan>
          </text>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold">Manager Dashboard</Typography>
          </Box>
        </h1>
        <div>
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="dashboard-summary">
        <div className="summary-card">
          <div className="icon-blue">📞</div>
          <div className="summary-content">
            <h2>{dashboardData.totalCalls}</h2>
            <p>Calls made this week</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="icon-yellow">🏆</div>
          <div className="summary-content">
            <h2>{dashboardData.salesClosed}</h2>
            <p>Sales closed</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="icon-orange">⏱️</div>
          <div className="summary-content">
            <h2>{dashboardData.callMinutes}</h2>
            <p>Minutes on call</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="icon-purple">📋</div>
          <div className="summary-content">
            <h2>{dashboardData.salesPending}</h2>
            <p>Sales pending</p>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="left-column">
          <div className="top-sales-section">
            <div className="section-header">
              <h2>Top Sales Reps</h2>
              <button className="see-more">See More</button>
            </div>
            <table className="top-sales-table">
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Name</th>
                  <th>Monthly</th>
                  <th>Deals</th>
                  <th>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.topSalesReps.map((rep, index) => (
                  <tr key={rep.id}>
                    <td>{index + 1}</td>
                    <td className="name-cell">
                      <div className="avatar">{rep.name.charAt(0)}</div>
                      <span>{rep.name}</span>
                    </td>
                    <td>{rep.month}</td>
                    <td>{rep.deals}</td>
                    <td className="sales-amount">${rep.totalSales.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="recent-calls-section">
            <h2>Recent Calls</h2>
            <table className="recent-calls-table">
              <thead>
                <tr>
                  <th>Call Date</th>
                  <th>Client</th>
                  <th>Sales Rep</th>
                  <th>Call Duration</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentCalls.map((call, index) => (
                  <tr key={index}>
                    <td>{call.date}</td>
                    <td>{call.client}</td>
                    <td>{call.salesRep}</td>
                    <td>{call.duration}</td>
                    <td>
                      <span className={`status-badge ${call.outcome.toLowerCase()}`}>
                        {call.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="right-column">
          <div className="sentiment-section">
            <h2>Sentiment Breakdown</h2>
            <div className="weekly-toggle">
              <span>Weekly</span>
            </div>
            <div className="sentiment-chart">
              {renderSentimentPieChart()}
            </div>
            <div className="sentiment-legend">
              <div className="legend-item">
                <div className="legend-color positive"></div>
                <span>Positive</span>
              </div>
              <div className="legend-item">
                <div className="legend-color negative"></div>
                <span>Negative</span>
              </div>
              <div className="legend-item">
                <div className="legend-color neutral"></div>
                <span>Neutral</span>
              </div>
            </div>
          </div>

          <div className="sales-overview">
            <div className="sales-header">
              <div className="shopping-icon">🛒</div>
              <div className="sales-total">
                <h2>{dashboardData.monthlySales}</h2>
                <p>Total Sales January</p>
              </div>
              <div className="sales-today">+3 Sales Today</div>
            </div>
            <div className="sales-chart">
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={salesTrend}>
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#FFA500" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                  <XAxis dataKey="day" hide={true} />
                  <YAxis hide={true} />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;