import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, 
  Mail, 
  X, 
  User, 
  ChevronRight, 
  Calendar, 
  Award, 
  DollarSign, 
  UserCheck,
  BarChart2,
  Edit,
  Trash2
} from 'lucide-react';
import supabase from '../utils/supabaseClient';
import '../styles/salesreps.css';

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
      '#5a2ca0', // Primary purple - use this most often
      '#6D3EB7', // Lighter purple
      '#501F8C', // Darker purple
      '#7248C7', // Another purple shade
      '#4A1D85'  // Deep purple
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

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  const formatPhone = (phone) => {
    if (!phone) return 'N/A';
    const phoneStr = phone.toString();
    return `+${phoneStr}`;
  };
  
  // Get the total clients count for a sales rep
  const getClientCount = (repId) => {
    return repTotalClients[repId] || 0;
  };
  
  // Handle close sidebar
  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setSelectedRep(null);
  };
  
  // Make table row clickable to view rep details
  const handleRowClick = (rep) => {
    setSelectedRep(rep);
    setShowSidebar(true);
  };

  return (
    <DashboardLayout>
      <div className={`sales-rep-container ${showSidebar ? 'with-sidebar' : ''}`}>
        <div className="header">
          <h1>Sales Rep List</h1>
          <button className="add-rep-btn compact" onClick={() => setIsAddingRep(true)}>
            +Add Rep
          </button>
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
                    <th className="name-col">Name <span>▾</span></th>
                    <th className="email-col">Email <span>▾</span></th>
                    <th className="phone-col">Phone number <span>▾</span></th>
                    <th className="stats-col">Stats <span>▾</span></th>
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
                      onClick={() => handleRowClick(rep)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="name-cell">
                        <div className="name-with-avatar">
                          <div 
                            className="avatar"
                            style={{
                              backgroundColor: getAvatarColor(`${rep.sales_rep_first_name} ${rep.sales_rep_last_name}`)
                            }}
                          >
                            {rep.sales_rep_first_name?.charAt(0) || ''}
                            {rep.sales_rep_last_name?.charAt(0) || ''}
                          </div>
                          <span className="rep-name-text">{`${rep.sales_rep_first_name || ''} ${rep.sales_rep_last_name || ''}`}</span>
                        </div>
                      </td>
                      <td className="email-cell">{rep['Email']}</td>
                      <td className="phone-cell">{formatPhone(rep['Phone Number'])}</td>
                      <td>
                        <button 
                          className="view-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewRep(rep);
                          }}
                        >
                          View
                        </button>
                      </td>
                      <td>
                        <div className="actions">
                          <div className="dropdown">
                            <button 
                              className="menu-btn"
                              onClick={(e) => e.stopPropagation()}
                            >⋯</button>
                            <div className="dropdown-content">
                              <button onClick={() => handleViewRep(rep)}>View Details</button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSalesRep(rep.sales_rep_id);
                                }} 
                                className="delete-option"
                              >Delete</button>
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

        {/* Sales Rep Detail Sidebar */}
        <div className={`rep-detail-sidebar ${showSidebar ? 'show' : ''}`}>
          {selectedRep && (
            <>
              <div className="sidebar-header">
                <h3 className="sidebar-title">Rep Details</h3>
                <button className="close-sidebar" onClick={handleCloseSidebar}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="rep-profile">
                <div 
                  className="rep-avatar"
                  style={{
                    backgroundColor: getAvatarColor(`${selectedRep.sales_rep_first_name} ${selectedRep.sales_rep_last_name}`)
                  }}
                >
                  {selectedRep.sales_rep_first_name?.charAt(0) || ''}
                  {selectedRep.sales_rep_last_name?.charAt(0) || ''}
                </div>
                <h2 className="rep-name">{`${selectedRep.sales_rep_first_name || ''} ${selectedRep.sales_rep_last_name || ''}`}</h2>
                <p className="rep-title">Sales Representative</p>
                
                <div className="rep-stats">
                  <div className="stat-item">
                    <div className="stat-value">{getClientCount(selectedRep.sales_rep_id)}</div>
                    <div className="stat-label">Clients</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{formatCurrency(repTotalSales[selectedRep.sales_rep_id] || 0)}</div>
                    <div className="stat-label">Total Sales</div>
                  </div>
                </div>
              </div>
              
              <div className="rep-details">
                <div className="detail-section">
                  <h4 className="section-title">
                    <User size={16} />
                    Contact Information
                  </h4>
                  <ul className="detail-list">
                    <li className="detail-item">
                      <Mail className="detail-icon" size={16} />
                      <div className="detail-content">
                        <div className="detail-label">Email</div>
                        <div className="detail-value">{selectedRep['Email'] || 'Not provided'}</div>
                      </div>
                    </li>
                    <li className="detail-item">
                      <Phone className="detail-icon" size={16} />
                      <div className="detail-content">
                        <div className="detail-label">Phone</div>
                        <div className="detail-value">{formatPhone(selectedRep['Phone Number'])}</div>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="detail-section">
                  <h4 className="section-title">
                    <BarChart2 size={16} />
                    Performance Metrics
                  </h4>
                  
                  <div className="performance-card">
                    <h5 className="performance-title">Sales Overview</h5>
                    <div className="performance-stat">
                      <div className="performance-label">Total Sales</div>
                      <div className="performance-value">{formatCurrency(repTotalSales[selectedRep.sales_rep_id] || 0)}</div>
                    </div>
                    <div className="performance-stat">
                      <div className="performance-label">Clients</div>
                      <div className="performance-value">{getClientCount(selectedRep.sales_rep_id)}</div>
                    </div>
                    <div className="performance-stat">
                      <div className="performance-label">Avg. Sale Value</div>
                      <div className="performance-value">
                        {getClientCount(selectedRep.sales_rep_id) > 0 
                          ? formatCurrency((repTotalSales[selectedRep.sales_rep_id] || 0) / getClientCount(selectedRep.sales_rep_id)) 
                          : '$0'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <button 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#f0f2f5',
                        border: '1px solid #e1e4e8',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: '#555',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Edit size={14} />
                      Edit Details
                    </button>
                    <button 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        color: '#b91c1c',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        deleteSalesRep(selectedRep.sales_rep_id);
                        handleCloseSidebar();
                      }}
                    >
                      <Trash2 size={14} />
                      Delete Rep
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

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