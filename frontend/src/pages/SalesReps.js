import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import '../styles/salesreps.css';

// Supabase configuration
const supabaseUrl = 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';
const supabase = createClient(supabaseUrl, supabaseKey);

const SalesReps = () => {
  const { user } = useAuth();
  
  // State variables
  const [salesReps, setSalesReps] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [selectedRep, setSelectedRep] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAddingRep, setIsAddingRep] = useState(false);
  const [newRep, setNewRep] = useState({
    sales_rep_first_name: '',
    sales_rep_last_name: '',
    'Phone Number': '',
    'Email': ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoverRowId, setHoverRowId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [repTotalSales, setRepTotalSales] = useState({});
  const [repTotalClients, setRepTotalClients] = useState({});

  // Generate a random color for avatars
  const getAvatarColor = (name) => {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33F3',
      '#33FFF3', '#F3FF33', '#9B33FF', '#FF9B33', '#33FF9B'
    ];
    
    // Use the first character of the name to determine color index
    const firstChar = (name || '').charAt(0).toLowerCase();
    const colorIndex = firstChar.charCodeAt(0) % colors.length;
    return colors[colorIndex];
  };

  // Show success message with timeout
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  // Fetch sales reps data from Supabase
  const fetchSalesReps = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .order('sales_rep_id', { ascending: true });

      if (error) {
        throw error;
      }

      setSalesReps(data);
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      setError('Failed to load sales representatives');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch sales data from Supabase
  const fetchSalesData = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_data')
        .select('*');

      if (error) {
        throw error;
      }

      setSalesData(data);
      
      // Calculate total sales for each rep
      const salesByRep = {};
      const clientsByRep = {};
      
      data.forEach(sale => {
        // Sum up sales amounts
        if (!salesByRep[sale.sales_rep_id]) {
          salesByRep[sale.sales_rep_id] = 0;
        }
        salesByRep[sale.sales_rep_id] += parseFloat(sale.sale_amount);
        
        // Count unique clients
        if (!clientsByRep[sale.sales_rep_id]) {
          clientsByRep[sale.sales_rep_id] = new Set();
        }
        clientsByRep[sale.sales_rep_id].add(sale.customer_id);
      });
      
      // Convert sets to counts for clients
      const clientCounts = {};
      Object.keys(clientsByRep).forEach(repId => {
        clientCounts[repId] = clientsByRep[repId].size;
      });
      
      setRepTotalSales(salesByRep);
      setRepTotalClients(clientCounts);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  // Add a new sales rep
  const addSalesRep = async () => {
    try {
      // Validate form
      if (!newRep.sales_rep_first_name || !newRep.sales_rep_last_name || !newRep['Email']) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newRep['Email'])) {
        alert('Please enter a valid email address');
        return;
      }

      // Validate phone format if provided
      if (newRep['Phone Number'] && !/^\d+$/.test(newRep['Phone Number'])) {
        alert('Phone number should contain only digits');
        return;
      }

      const { data, error } = await supabase
        .from('sales_reps')
        .insert([
          {
            sales_rep_first_name: newRep.sales_rep_first_name,
            sales_rep_last_name: newRep.sales_rep_last_name,
            'Phone Number': newRep['Phone Number'] ? parseInt(newRep['Phone Number']) : null,
            'Email': newRep['Email']
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      // Reset form and refresh data
      setNewRep({
        sales_rep_first_name: '',
        sales_rep_last_name: '',
        'Phone Number': '',
        'Email': ''
      });
      setIsAddingRep(false);
      fetchSalesReps();
      showSuccessMessage('Sales representative added successfully!');
    } catch (error) {
      console.error('Error adding sales rep:', error);
      alert(`Failed to add sales representative: ${error.message}`);
    }
  };

  // Delete a sales rep
  const deleteSalesRep = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sales representative?')) {
      return;
    }

    try {
      // Check if rep has associated sales data
      const { data: salesData, error: salesError } = await supabase
        .from('sales_data')
        .select('sale_id')
        .eq('sales_rep_id', id)
        .limit(1);

      if (salesError) throw salesError;

      // If sales data exists, ask user if they want to proceed
      if (salesData && salesData.length > 0) {
        const confirmDelete = window.confirm(
          'This sales representative has associated sales data. Deleting will not remove the sales records. Do you want to proceed?'
        );
        if (!confirmDelete) return;
      }

      const { error } = await supabase
        .from('sales_reps')
        .delete()
        .eq('sales_rep_id', id);

      if (error) {
        throw error;
      }

      // Close sidebar if the deleted rep was selected
      if (selectedRep && selectedRep.sales_rep_id === id) {
        setShowSidebar(false);
        setSelectedRep(null);
      }

      fetchSalesReps();
      showSuccessMessage('Sales representative deleted successfully!');
    } catch (error) {
      console.error('Error deleting sales rep:', error);
      alert(`Failed to delete sales representative: ${error.message}`);
    }
  };

  // Handle viewing a sales rep
  const handleViewRep = (rep) => {
    setSelectedRep(rep);
    setShowSidebar(true);
  };

  // Filter sales reps based on search term
  const filteredReps = salesReps.filter(rep => {
    const fullName = `${rep.sales_rep_first_name || ''} ${rep.sales_rep_last_name || ''}`.toLowerCase();
    const email = (rep['Email'] || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search);
  });

  // Get recent activity for a rep
  const getRepActivity = (repId) => {
    // Filter and sort sales data for this rep
    const repSales = salesData
      .filter(sale => sale.sales_rep_id === repId)
      .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    
    if (repSales.length === 0) return "No activity";
    
    // Get most recent sale date
    const lastSaleDate = new Date(repSales[0].sale_date);
    const today = new Date();
    const diffTime = Math.abs(today - lastSaleDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchSalesReps();
    fetchSalesData();
  }, []);
  
  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
      <div className={`sales-rep-container ${showSidebar ? 'with-sidebar' : ''}`}>
        <div className="header">
          <h1>Sales Rep List</h1>
          <button className="add-rep-btn pulse-animation" onClick={() => setIsAddingRep(true)}>
            + Add Rep
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>

        {successMessage && (
          <div className="success-message">
            <span>✓</span> {successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading sales representatives...</p>
          </div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="table-container">
            {filteredReps.length === 0 ? (
              <div className="no-results">
                <p>No sales representatives found matching "{searchTerm}"</p>
                <button className="clear-search-btn" onClick={() => setSearchTerm('')}>Clear Search</button>
              </div>
            ) : (
              <table className="sales-rep-table">
                <thead>
                  <tr>
                    <th className="name-col">Name</th>
                    <th className="email-col">Email</th>
                    <th className="phone-col">Phone number</th>
                    <th className="sales-col">Total Sales</th>
                    <th className="stats-col">Stats</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReps.map((rep) => (
                    <tr 
                      key={rep.sales_rep_id} 
                      onMouseEnter={() => setHoverRowId(rep.sales_rep_id)}
                      onMouseLeave={() => setHoverRowId(null)}
                      className={`${hoverRowId === rep.sales_rep_id ? 'row-hover' : ''} ${selectedRep?.sales_rep_id === rep.sales_rep_id ? 'row-selected' : ''}`}
                    >
                      <td className="name-cell">
                        <div className="name-with-avatar">
                          <div 
                            className="avatar"
                            style={{
                              backgroundColor: getAvatarColor(`${rep.sales_rep_first_name} ${rep.sales_rep_last_name}`),
                              color: 'white'
                            }}
                          >
                            {rep.sales_rep_first_name?.charAt(0) || ''}
                            {rep.sales_rep_last_name?.charAt(0) || ''}
                          </div>
                          <span className="rep-name-text">{`${rep.sales_rep_first_name || ''} ${rep.sales_rep_last_name || ''}`}</span>
                        </div>
                      </td>
                      <td className="email-cell">{rep['Email']}</td>
                      <td className="phone-cell">{rep['Phone Number'] ? `+${rep['Phone Number']}` : 'N/A'}</td>
                      <td className="sales-cell">
                        <div className="sales-amount">
                          {repTotalSales[rep.sales_rep_id] 
                            ? formatCurrency(repTotalSales[rep.sales_rep_id]) 
                            : '$0.00'}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="view-btn" 
                          onClick={() => handleViewRep(rep)}
                        >
                          View
                        </button>
                      </td>
                      <td>
                        <div className="actions">
                          <div className="dropdown">
                            <button className="menu-btn">⋯</button>
                            <div className="dropdown-content">
                              <button onClick={() => handleViewRep(rep)}>View Details</button>
                              <button onClick={() => deleteSalesRep(rep.sales_rep_id)} className="delete-option">Delete</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Sidebar for viewing rep details */}
        {showSidebar && selectedRep && (
          <div className="sidebar slide-in">
            <div className="sidebar-content">
              <div className="sidebar-header">
                <div 
                  className="large-avatar"
                  style={{
                    backgroundColor: getAvatarColor(`${selectedRep.sales_rep_first_name} ${selectedRep.sales_rep_last_name}`),
                    color: 'white'
                  }}
                >
                  {selectedRep.sales_rep_first_name?.charAt(0) || ''}
                  {selectedRep.sales_rep_last_name?.charAt(0) || ''}
                </div>
                <div className="rep-name">
                  <h2>{`${selectedRep.sales_rep_first_name || ''} ${selectedRep.sales_rep_last_name || ''}`}</h2>
                  <p>Sales Rep</p>
                </div>
                <button className="close-btn" onClick={() => setShowSidebar(false)}>×</button>
              </div>

              <div className="sidebar-actions">
                <button className="edit-btn">
                  <span className="icon">✏️</span> Edit
                </button>
                <button className="delete-btn" onClick={() => deleteSalesRep(selectedRep.sales_rep_id)}>
                  <span className="icon">🗑️</span> Delete
                </button>
              </div>

              <div className="contact-info">
                <h3>Contact Info</h3>
                
                <div className="contact-item">
                  <span className="icon email-icon">✉️</span>
                  <p>{selectedRep['Email'] || 'No email available'}</p>
                </div>
                
                <div className="contact-item">
                  <span className="icon phone-icon">📞</span>
                  <p>{selectedRep['Phone Number'] ? `+${selectedRep['Phone Number']}` : 'No phone available'}</p>
                </div>
              </div>

              <div className="rep-summary">
                <h3>Summary</h3>
                <div className="summary-items">
                  <div className="summary-item">
                    <div className="summary-value highlight-value">
                      {repTotalSales[selectedRep.sales_rep_id] 
                        ? formatCurrency(repTotalSales[selectedRep.sales_rep_id]) 
                        : '$0.00'}
                    </div>
                    <div className="summary-label">Total Sales</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-value">
                      {repTotalClients[selectedRep.sales_rep_id] || 0}
                    </div>
                    <div className="summary-label">Clients</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-value">
                      {getRepActivity(selectedRep.sales_rep_id)}
                    </div>
                    <div className="summary-label">Last Activity</div>
                  </div>
                </div>
              </div>

              {/* Recent Sales Section */}
              <div className="recent-sales">
                <h3>Recent Sales</h3>
                {salesData.filter(sale => sale.sales_rep_id === selectedRep.sales_rep_id)
                  .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
                  .slice(0, 5)
                  .map(sale => (
                    <div key={sale.sale_id} className="recent-sale-item">
                      <div className="sale-header">
                        <div className="sale-date">{new Date(sale.sale_date).toLocaleDateString()}</div>
                        <div className="sale-amount">{formatCurrency(sale.sale_amount)}</div>
                      </div>
                      <div className="sale-product">
                        <span>{sale.product_name}</span>
                        <span className="sale-quantity">× {sale.quantity_sold}</span>
                      </div>
                      <div className="sale-customer">
                        Customer: {sale.customer_first_name} {sale.customer_last_name}
                      </div>
                    </div>
                  ))}
                {salesData.filter(sale => sale.sales_rep_id === selectedRep.sales_rep_id).length === 0 && (
                  <div className="no-sales">No sales data available for this representative</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Rep Modal */}
        {isAddingRep && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target.className === 'modal-overlay') setIsAddingRep(false);
          }}>
            <div className="add-rep-modal slide-up">
              <div className="modal-header">
                <h2>Add New Sales Representative</h2>
                <button className="close-modal-btn" onClick={() => setIsAddingRep(false)}>×</button>
              </div>
              <div className="form-group">
                <label>First Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={newRep.sales_rep_first_name}
                  onChange={(e) => setNewRep({...newRep, sales_rep_first_name: e.target.value})}
                  placeholder="First Name"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Last Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={newRep.sales_rep_last_name}
                  onChange={(e) => setNewRep({...newRep, sales_rep_last_name: e.target.value})}
                  placeholder="Last Name"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={newRep['Email']}
                  onChange={(e) => setNewRep({...newRep, 'Email': e.target.value})}
                  placeholder="Email"
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={newRep['Phone Number']}
                  onChange={(e) => setNewRep({...newRep, 'Phone Number': e.target.value})}
                  placeholder="Phone Number (numbers only)"
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setIsAddingRep(false)}>Cancel</button>
                <button className="save-btn" onClick={addSalesRep}>
                  <span className="save-icon">💾</span> Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SalesReps;