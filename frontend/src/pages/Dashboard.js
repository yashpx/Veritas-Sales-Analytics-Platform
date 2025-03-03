import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { fetchDashboardData } from '../utils/dashboardApiClient';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Format current date
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    setCurrentDate(formattedDate);

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        setDashboardData(data);
        
        // Extract sales trend from data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();
        
        const trendData = last7Days.map(day => ({
          day: day.slice(8, 10),
          sales: Math.floor(Math.random() * 10 + 5) // For demo purposes - replace with real data
        }));
        
        setSalesTrend(trendData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-loading">
          <h2>Loading dashboard data...</h2>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="dashboard-error">
          <h2>Error: {error}</h2>
          <p>Please try refreshing the page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Manager Dashboard</h1>
          <div className="date-display">
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
    </DashboardLayout>
  );
};

export default Dashboard;