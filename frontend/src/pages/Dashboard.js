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
    currentMonthName: '',
    callSentiment: { positive: 0, negative: 0, neutral: 0 },
    sentimentData: { positive: 0, negative: 0, neutral: 0, total: 0 }
  });
  const [salesTrend, setSalesTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Remove sentimentTimeframe since API doesn't support separate weekly/monthly sentiment
  // Add state for the summary timeframe filter
  const [summaryTimeframe, setSummaryTimeframe] = useState('weekly');
  
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Pass the selected timeframe to the fetch function
        const data = await fetchDashboardData(summaryTimeframe);
        
        if (data.error) {
          throw new Error(data.errorMessage);
        }
        
        setDashboardData(data);
        setSalesTrend(data.salesTrend || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError("Failed to load dashboard data: " + err.message);
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, summaryTimeframe]); // Add summaryTimeframe to dependencies

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // For the pie chart
  const COLORS = ['#4ADE80', '#FF6B6B', '#E2E8F0'];

  const renderSentimentPieChart = () => {
    // Use the sentiment data directly from the API response
    const data = [
      { name: 'Positive', value: dashboardData.callSentiment.positive },
      { name: 'Negative', value: dashboardData.callSentiment.negative },
      { name: 'Neutral', value: dashboardData.callSentiment.neutral }
    ];

    return (
      <ResponsiveContainer width="100%" height={200}>
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

  // Format the monthlySales value with commas for thousands
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Custom function to render the SN column with medals for top 3
  const renderSNColumn = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
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
          {/* Replace date display with timeframe filter */}
          <div className="timeframe-filter">
            <button 
              className={`filter-btn ${summaryTimeframe === 'weekly' ? 'active' : ''}`}
              onClick={() => setSummaryTimeframe('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`filter-btn ${summaryTimeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setSummaryTimeframe('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="dashboard-summary">
          <div className="summary-card">
            <div className="icon-blue">📞</div>
            <div className="summary-content">
              <h2>{dashboardData.totalCalls}</h2>
              <p>Calls made this {summaryTimeframe === 'weekly' ? 'week' : 'month'}</p>
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
              </div>
              <div className="top-sales-content">
                <table className="top-sales-table">
                  <thead>
                    <tr>
                      <th className="sn-column">SN</th>
                      <th className="name-column">Name</th>
                      <th className="monthly-column">Period</th>
                      <th className="deals-column">Deals</th>
                      <th className="total-sales-column">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.topSalesReps.length > 0 ? (
                      dashboardData.topSalesReps.map((rep, index) => (
                        <tr key={rep.id || index}>
                          <td className="sn-column">{renderSNColumn(index)}</td>
                          <td className="name-column">
                            <div className="name-cell">
                              <div className="avatar">{rep.name.charAt(0)}</div>
                              <span>{rep.name}</span>
                            </div>
                          </td>
                          <td className="monthly-column">{rep.month}</td>
                          <td className="deals-column">{rep.deals}</td>
                          <td className="total-sales-column">{formatCurrency(rep.totalSales)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>No sales data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="recent-calls-section">
              <h2>Recent Calls</h2>
              <div className="recent-calls-content">
                <table className="recent-calls-table">
                  <thead>
                    <tr>
                      <th className="call-date-column">Call Date</th>
                      <th className="client-column">Client</th>
                      <th className="sales-rep-column">Sales Rep</th>
                      <th className="duration-column">Call Duration</th>
                      <th className="outcome-column">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentCalls.length > 0 ? (
                      dashboardData.recentCalls.map((call, index) => (
                        <tr key={index}>
                          <td className="call-date-column">{call.date}</td>
                          <td className="client-column">{call.client}</td>
                          <td className="sales-rep-column">{call.salesRep}</td>
                          <td className="duration-column">{call.duration}</td>
                          <td className="outcome-column">
                            <span className={`status-badge ${call.outcome.toLowerCase()}`}>
                              {call.outcome}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>No recent calls available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="sentiment-section">
              <h2>Sentiment Breakdown</h2>
              <div className="sentiment-chart">
                {renderSentimentPieChart()}
              </div>
              <div className="sentiment-legend">
                <div className="legend-item">
                  <div className="legend-color positive"></div>
                  <span>Positive {dashboardData.callSentiment.positive}%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color negative"></div>
                  <span>Negative {dashboardData.callSentiment.negative}%</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color neutral"></div>
                  <span>Neutral {dashboardData.callSentiment.neutral}%</span>
                </div>
              </div>
              <div className="sentiment-stats">
                <small>Based on {dashboardData.sentimentData.total} analyzed calls</small>
              </div>
            </div>

            <div className="sales-overview">
              <div className="sales-header">
                <div className="shopping-icon">🛒</div>
                <div className="sales-total">
                  <h2>{formatCurrency(dashboardData.monthlySales)}</h2>
                  <p>Total Sales {dashboardData.currentMonthName}</p>
                </div>
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