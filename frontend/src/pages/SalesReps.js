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
  Trash2,
  Save,
  XCircle
} from 'lucide-react';
import supabase from '../utils/supabaseClient';
import RegisterSalesRepForm from '../components/auth/RegisterSalesRepForm';
import '../styles/salesreps.css';

const SalesReps = () => {
  const { user } = useAuth();
  
  // State variables
  const [salesReps, setSalesReps] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [selectedRep, setSelectedRep] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isAddingRep, setIsAddingRep] = useState(false);
  const [isEditingRep, setIsEditingRep] = useState(false);
  const [editingRep, setEditingRep] = useState({
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

  // This section was replaced by the RegisterSalesRepForm component
  // which creates both a sales_rep and user_auth entry

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
  
  // Handle editing a sales rep
  const handleEditRep = () => {
    setEditingRep({...selectedRep});
    setIsEditingRep(true);
  };

  // Handle cancelling edit
  const handleCancelEdit = () => {
    setIsEditingRep(false);
  };
  
  // Update a sales rep
  const updateSalesRep = async () => {
    try {
      // Validate form
      if (!editingRep.sales_rep_first_name || !editingRep.sales_rep_last_name || !editingRep['Email']) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editingRep['Email'])) {
        alert('Please enter a valid email address');
        return;
      }

      // Validate phone format if provided
      if (editingRep['Phone Number'] && !/^\d+$/.test(editingRep['Phone Number'])) {
        alert('Phone number should contain only digits');
        return;
      }

      const { data, error } = await supabase
        .from('sales_reps')
        .update({
          sales_rep_first_name: editingRep.sales_rep_first_name,
          sales_rep_last_name: editingRep.sales_rep_last_name,
          'Phone Number': editingRep['Phone Number'] ? parseInt(editingRep['Phone Number']) : null,
          'Email': editingRep['Email']
        })
        .eq('sales_rep_id', editingRep.sales_rep_id)
        .select();

      if (error) {
        throw error;
      }

      // Update the selected rep with the new data
      setSelectedRep(data[0]);
      setIsEditingRep(false);
      fetchSalesReps();
      showSuccessMessage('Sales representative updated successfully!');
    } catch (error) {
      console.error('Error updating sales rep:', error);
      alert(`Failed to update sales representative: ${error.message}`);
    }
  };

  // Handle close sidebar
  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setSelectedRep(null);
    setIsEditingRep(false);
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
                      <td className="stats-cell">
                        <div>
                          <strong>{formatCurrency(repTotalSales[rep.sales_rep_id] || 0)}</strong>
                          <span> • </span>
                          <span>{getClientCount(rep.sales_rep_id)} clients</span>
                        </div>
                      </td>
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

        {/* Rep Detail Sidebar */}
        <div className={`rep-detail-sidebar ${showSidebar ? 'show' : ''}`}>
          <div className="sidebar-header">
            <h3 className="sidebar-title">Sales Rep Details</h3>
            <button className="close-sidebar" onClick={handleCloseSidebar}>
              <X size={18} />
            </button>
          </div>
          
          {selectedRep && (
            <>
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
                <h2 className="rep-name">
                  {isEditingRep ? (
                    <div className="edit-name-fields">
                      <input 
                        type="text" 
                        value={editingRep.sales_rep_first_name} 
                        onChange={(e) => setEditingRep({...editingRep, sales_rep_first_name: e.target.value})}
                        placeholder="First Name"
                      />
                      <input 
                        type="text" 
                        value={editingRep.sales_rep_last_name} 
                        onChange={(e) => setEditingRep({...editingRep, sales_rep_last_name: e.target.value})}
                        placeholder="Last Name"
                      />
                    </div>
                  ) : (
                    <>
                      {selectedRep.sales_rep_first_name} {selectedRep.sales_rep_last_name}
                    </>
                  )}
                </h2>
                <p className="rep-title">Sales Representative</p>
                
                <div className="rep-stats">
                  <div className="stat-item">
                    <span className="stat-value">{formatCurrency(repTotalSales[selectedRep.sales_rep_id] || 0)}</span>
                    <span className="stat-label">Total Sales</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{getClientCount(selectedRep.sales_rep_id)}</span>
                    <span className="stat-label">Clients</span>
                  </div>
                </div>
              </div>

              <div className="rep-details">
                {isEditingRep ? (
                  <div className="edit-details-form">
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        value={editingRep['Email']} 
                        onChange={(e) => setEditingRep({...editingRep, 'Email': e.target.value})}
                        placeholder="Email address"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        type="tel" 
                        value={editingRep['Phone Number']} 
                        onChange={(e) => setEditingRep({...editingRep, 'Phone Number': e.target.value})}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="form-actions">
                      <button className="save-btn" onClick={updateSalesRep}>
                        <Save size={16} /> Save Changes
                      </button>
                      <button className="cancel-btn" onClick={handleCancelEdit}>
                        <XCircle size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="detail-section">
                      <h4 className="section-title">
                        <User size={16} /> Contact Information
                      </h4>
                      <ul className="detail-list">
                        <li className="detail-item">
                          <span className="detail-icon">
                            <Mail size={16} />
                          </span>
                          <div className="detail-content">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{selectedRep['Email'] || 'N/A'}</span>
                          </div>
                        </li>
                        <li className="detail-item">
                          <span className="detail-icon">
                            <Phone size={16} />
                          </span>
                          <div className="detail-content">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{formatPhone(selectedRep['Phone Number'])}</span>
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="detail-section">
                      <h4 className="section-title">
                        <BarChart2 size={16} /> Performance
                      </h4>
                      <div className="performance-card">
                        <div className="performance-stat">
                          <span className="performance-label">Total Sales</span>
                          <span className="performance-value">{formatCurrency(repTotalSales[selectedRep.sales_rep_id] || 0)}</span>
                        </div>
                        <div className="performance-stat">
                          <span className="performance-label">Clients</span>
                          <span className="performance-value">{getClientCount(selectedRep.sales_rep_id)}</span>
                        </div>
                        <div className="performance-stat">
                          <span className="performance-label">Avg. Sale Value</span>
                          <span className="performance-value">
                            {getClientCount(selectedRep.sales_rep_id) > 0 
                              ? formatCurrency((repTotalSales[selectedRep.sales_rep_id] || 0) / getClientCount(selectedRep.sales_rep_id)) 
                              : '$0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-actions">
                      <button className="action-btn edit-btn" onClick={handleEditRep}>
                        <Edit size={16} /> Edit
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => deleteSalesRep(selectedRep.sales_rep_id)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Add Rep Modal */}
        {isAddingRep && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target.className === 'modal-overlay') setIsAddingRep(false);
          }}>
            <div className="add-rep-modal">
              <div className="modal-header">
                <h2>Add New Sales Representative</h2>
                <button className="close-modal-btn" onClick={() => setIsAddingRep(false)}>×</button>
              </div>
              
              <RegisterSalesRepForm 
                onSuccess={(data) => {
                  setIsAddingRep(false);
                  fetchSalesReps();
                  showSuccessMessage('Sales representative added successfully!');
                }}
              />
              
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SalesReps;