import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Phone, Mail, ChevronLeft, Edit, Search, Plus, X, User, Briefcase, FileText, Trash2, Save } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabaseClient';
import '../styles/calls.css';

const Customers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalPosition, setDeleteModalPosition] = useState({ top: 0, left: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const deleteButtonRef = useRef(null);
  
  // Added state for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContact, setEditedContact] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  
  const [newContact, setNewContact] = useState({
    customer_first_name: '',
    customer_last_name: '',
    "Customer Email": '',
    "Company": '',
    "Title": '',
    "phone number": ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      // Join the customers table with call_logs to get the required data
      const { data, error } = await supabase
        .from('customers')
        .select(`
          customer_id,
          customer_first_name,
          customer_last_name,
          "Customer Email",
          "Company",
          "Title",
          "phone number",
          call_logs (
            call_id,
            call_date,
            duration_minutes,
            call_outcome,
            notes,
            sales_rep_id
          )
        `)
        .order('customer_last_name', { ascending: true });

      if (error) throw error;

      // Transform the data to match our UI requirements
      const transformedData = data.map(customer => {
        // Get the most recent call for this customer
        const calls = customer.call_logs || [];
        const latestCall = calls.length > 0 
          ? calls.sort((a, b) => new Date(b.call_date) - new Date(a.call_date))[0] 
          : null;
        
        return {
          id: customer.customer_id,
          name: `${customer.customer_first_name} ${customer.customer_last_name}`,
          firstName: customer.customer_first_name,
          lastName: customer.customer_last_name,
          phone: customer["phone number"] ? `+${customer["phone number"]}` : 'No phone number',
          rawPhone: customer["phone number"] || '',
          email: customer["Customer Email"] || `${customer.customer_first_name?.toLowerCase()}${customer.customer_last_name?.toLowerCase()}@example.com`,
          company: customer["Company"] || 'Not specified',
          title: customer["Title"] || 'Not specified',
          status: latestCall?.call_outcome || 'No Account Created',
          header: customer["phone number"] ? `+${customer["phone number"]}` : 'No phone number',
          state: latestCall ? 'Client' : 'No Account Created',
          calls: calls,
          notes: latestCall?.notes || "No notes available"
        };
      });

      setContacts(transformedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
    }
  };

  const handleFilterClick = (newFilter) => {
    setFilter(newFilter);
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setIsEditMode(false);
    setUpdateError('');
    setUpdateSuccess('');
    
    // Initialize editedContact with the selected contact data
    setEditedContact({
      customer_id: contact.id,
      customer_first_name: contact.firstName,
      customer_last_name: contact.lastName,
      "Customer Email": contact.email,
      "Company": contact.company,
      "Title": contact.title,
      "phone number": contact.rawPhone
    });
  };

  const handleBackClick = () => {
    setSelectedContact(null);
    setIsEditMode(false);
  };

  const handleAddContactClick = () => {
    setShowAddModal(true);
  };
  
  const handleCallClick = (e, phoneNumber) => {
    e.stopPropagation();
    // Remove the + from the phone number if it exists
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    navigate('/dashboard/dialpad', { state: { phoneNumber: formattedNumber } });
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewContact({
      customer_first_name: '',
      customer_last_name: '',
      "Customer Email": '',
      "Company": '',
      "Title": '',
      "phone number": ''
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContact(prev => ({
      ...prev,
      [name]: name === "phone number" ? value.replace(/\D/g, '') : value
    }));
  };
  
  // Handle input change for edit form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditedContact(prev => ({
      ...prev,
      [name]: name === "phone number" ? value.replace(/\D/g, '') : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      // Validate form
      if (!newContact.customer_first_name || !newContact.customer_last_name) {
        throw new Error('First name and Last name are required');
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          customer_first_name: newContact.customer_first_name,
          customer_last_name: newContact.customer_last_name,
          "Customer Email": newContact["Customer Email"],
          "Company": newContact["Company"],
          "Title": newContact["Title"],
          "phone number": newContact["phone number"] ? parseInt(newContact["phone number"]) : null
        }])
        .select();

      if (error) throw error;

      setSuccessMessage('Contact added successfully!');
      
      // Refresh the contacts list
      fetchContacts();
      
      // Reset form after short delay to show success message
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
      
    } catch (error) {
      console.error('Error adding contact:', error);
      setErrorMessage(error.message || 'Failed to add contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  // New function to handle edit button click
  const handleEditClick = () => {
    setIsEditMode(true);
    setUpdateError('');
    setUpdateSuccess('');
  };
  
  // New function to save edited contact details
  const handleSaveEdit = async () => {
    if (!editedContact || !editedContact.customer_id) return;
    
    setIsUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');
    
    try {
      // Validate form
      if (!editedContact.customer_first_name || !editedContact.customer_last_name) {
        throw new Error('First name and Last name are required');
      }
      
      // Update customer in Supabase
      const { error } = await supabase
        .from('customers')
        .update({
          customer_first_name: editedContact.customer_first_name,
          customer_last_name: editedContact.customer_last_name,
          "Customer Email": editedContact["Customer Email"],
          "Company": editedContact["Company"],
          "Title": editedContact["Title"],
          "phone number": editedContact["phone number"] ? parseInt(editedContact["phone number"]) : null
        })
        .eq('customer_id', editedContact.customer_id);

      if (error) throw error;

      setUpdateSuccess('Contact updated successfully!');
      
      // Refresh contacts list after update
      fetchContacts();
      
      // Exit edit mode after short delay to show success message
      setTimeout(() => {
        setIsEditMode(false);
        
        // Update the selected contact with the new data
        const updatedContact = {
          ...selectedContact,
          firstName: editedContact.customer_first_name,
          lastName: editedContact.customer_last_name,
          name: `${editedContact.customer_first_name} ${editedContact.customer_last_name}`,
          email: editedContact["Customer Email"],
          company: editedContact["Company"] || 'Not specified',
          title: editedContact["Title"] || 'Not specified',
          rawPhone: editedContact["phone number"] || '',
          phone: editedContact["phone number"] ? `+${editedContact["phone number"]}` : 'No phone number',
        };
        
        setSelectedContact(updatedContact);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating contact:', error);
      setUpdateError(error.message || 'Failed to update contact');
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setUpdateError('');
    
    // Reset editedContact to original values
    if (selectedContact) {
      setEditedContact({
        customer_id: selectedContact.id,
        customer_first_name: selectedContact.firstName,
        customer_last_name: selectedContact.lastName,
        "Customer Email": selectedContact.email,
        "Company": selectedContact.company,
        "Title": selectedContact.title,
        "phone number": selectedContact.rawPhone
      });
    }
  };

  const handleDeleteClick = () => {
    if (deleteButtonRef.current) {
      const rect = deleteButtonRef.current.getBoundingClientRect();
      setDeleteModalPosition({
        top: rect.top,
        left: rect.left - 350, // Position modal to the left of the button
      });
    }
    setShowDeleteModal(true);
    setDeleteError('');
    setDeleteSuccess('');
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteContact = async () => {
    if (!selectedContact || !selectedContact.id) return;
    
    setIsDeleting(true);
    setDeleteError('');
    setDeleteSuccess('');
    
    try {
      // Delete customer from Supabase
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('customer_id', selectedContact.id);

      if (error) throw error;

      setDeleteSuccess('Contact deleted successfully!');
      
      // Refresh contacts list after deletion
      fetchContacts();
      
      // Close the delete modal and go back to contacts list after short delay
      setTimeout(() => {
        setShowDeleteModal(false);
        setSelectedContact(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error deleting contact:', error);
      setDeleteError(error.message || 'Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFilteredContacts = () => {
    let filtered = [...contacts];
    
    // Apply filter
    if (filter !== 'All') {
      filtered = filtered.filter(contact => contact.state === filter);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        contact.title.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
      <div className="calls-container">
        {!selectedContact ? (
          <>
            <div className="contacts-section">
              <div className="contacts-header">
                <div className="header-content">
                  <h1>Contacts</h1>
                  <p>{contacts.length} Total Contacts</p>
                </div>
                <button className="add-contact-button compact" onClick={handleAddContactClick}>
                  <Plus size={16} />
                  Add Contact
                </button>
              </div>

              <div className="filter-section">
                <button 
                  className={`filter-button ${filter === 'All' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('All')}>
                  All
                </button>
                <button 
                  className={`filter-button ${filter === 'Client' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('Client')}>
                  Client
                </button>
                <button 
                  className={`filter-button ${filter === 'No Account Created' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('No Account Created')}>
                  No Account Created
                </button>
                
                <div className="search-container">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search name, company, email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="contacts-table">
                <div className="table-header">
                  <div className="table-cell name-cell">Name</div>
                  <div className="table-cell">Phone Number</div>
                  <div className="table-cell">Email</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Company</div>
                  <div className="table-cell">Title</div>
                  <div className="table-cell call-cell">Actions</div>
                </div>
                
                <div className="table-body">
                  {loading ? (
                    <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading contacts...</p>
                  </div>
                ) : getFilteredContacts().length === 0 ? (
                  <div className="no-results">
                    <p>No contacts found. Try adjusting your search or filters.</p>
                    <button className="add-contact-button-small" onClick={handleAddContactClick}>
                      <Plus size={16} />
                      Add New Contact
                    </button>
                  </div>
                ) : (
                  getFilteredContacts().map(contact => (
                    <div 
                      key={contact.id} 
                      className="table-row"
                      onClick={() => handleContactClick(contact)}
                    >
                      <div className="table-cell name-cell">{contact.name}</div>
                      <div className="table-cell">{contact.phone}</div>
                      <div className="table-cell email-cell">{contact.email}</div>
                      <div className="table-cell">
                        {contact.state === 'Client' && (
                          <span className="status-badge client">
                            <span className="status-dot"></span>
                            Client
                          </span>
                        )}
                        {contact.state !== 'Client' && (
                          <span className="status-badge no-account">
                            <span className="status-dot"></span>
                            {contact.state}
                          </span>
                        )}
                      </div>
                      <div className="table-cell">{contact.company}</div>
                      <div className="table-cell">{contact.title}</div>
                      <div className="table-cell call-cell">
                        <button className="call-button" onClick={(e) => handleCallClick(e, contact.phone)}>
                          <Phone size={18} />
                        </button>
                        <button className="email-button" onClick={(e) => e.stopPropagation()}>
                          <Mail size={18} />
                        </button>
                        <button className="options-button" onClick={(e) => e.stopPropagation()}>
                          <span className="dots">⋮</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="contact-detail-view">
          <div className="contact-list-view">
            <div className="contacts-section">
              <div className="contacts-header">
                <div>
                  <h1>Contacts</h1>
                  <p>{contacts.length} Total Contacts</p>
                </div>
                <button className="add-contact-button" onClick={handleAddContactClick}>
                  <Plus size={18} />
                  Add Contact
                </button>
              </div>

              <div className="filter-section">
                <button 
                  className={`filter-button ${filter === 'All' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('All')}>
                  All
                </button>
                <button 
                  className={`filter-button ${filter === 'Client' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('Client')}>
                  Client
                </button>
                <button 
                  className={`filter-button ${filter === 'No Account Created' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('No Account Created')}>
                  No Account Created
                </button>
                
                <div className="search-container">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search name, company, email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="contacts-table">
                <div className="table-header">
                  <div className="table-cell name-cell">Name</div>
                  <div className="table-cell">Phone Number</div>
                  <div className="table-cell">Email</div>
                  <div className="table-cell">Status</div>
                  <div className="table-cell">Company</div>
                  <div className="table-cell">Title</div>
                  <div className="table-cell call-cell">Actions</div>
                </div>
                
                <div className="table-body">
                  {getFilteredContacts().map(contact => (
                    <div 
                      key={contact.id} 
                      className={`table-row ${selectedContact && selectedContact.id === contact.id ? 'selected' : ''}`}
                      onClick={() => handleContactClick(contact)}
                    >
                      <div className="table-cell name-cell">{contact.name}</div>
                      <div className="table-cell">{contact.phone}</div>
                      <div className="table-cell email-cell">{contact.email}</div>
                      <div className="table-cell">
                        {contact.state === 'Client' && (
                          <span className="status-badge client">
                            <span className="status-dot"></span>
                            Client
                          </span>
                        )}
                        {contact.state !== 'Client' && (
                          <span className="status-badge no-account">
                            <span className="status-dot"></span>
                            {contact.state}
                          </span>
                        )}
                      </div>
                      <div className="table-cell">{contact.company}</div>
                      <div className="table-cell">{contact.title}</div>
                      <div className="table-cell call-cell">
                        <button className="call-button" onClick={(e) => handleCallClick(e, contact.phone)}>
                          <Phone size={18} />
                        </button>
                        <button className="email-button" onClick={(e) => e.stopPropagation()}>
                          <Mail size={18} />
                        </button>
                        <button className="options-button" onClick={(e) => e.stopPropagation()}>
                          <span className="dots">⋮</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="contact-detail-panel">
            <div className="contact-detail-header">
              <button className="back-button" onClick={handleBackClick}>
                <ChevronLeft size={16} />
                Back
              </button>
              <div className="detail-action-buttons">
                {!isEditMode ? (
                  <>
                    <button className="edit-button" onClick={handleEditClick}>
                      <Edit size={16} />
                      Edit
                    </button>
                    <button 
                      className="delete-button" 
                      onClick={handleDeleteClick}
                      ref={deleteButtonRef}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="save-button"
                      onClick={handleSaveEdit}
                      disabled={isUpdating}
                    >
                      <Save size={16} />
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={handleCancelEdit}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {updateError && (
              <div className="error-message detail-message">
                {updateError}
              </div>
            )}
            
            {updateSuccess && (
              <div className="success-message detail-message">
                {updateSuccess}
              </div>
            )}

            <div className="contact-profile">
              <div className="avatar">
                {selectedContact.firstName.charAt(0)}{selectedContact.lastName.charAt(0)}
              </div>
              <h2>{selectedContact.name}</h2>
              <div className="profile-badge">
                <span className="status-dot"></span>
                {selectedContact.state}
              </div>
            </div>

            <div className="contact-actions">
              <button 
                className="action-button phone-action" 
                onClick={(e) => handleCallClick(e, selectedContact.phone)}
              >
                <Phone size={20} />
              </button>
              <button className="action-button email-action">
                <Mail size={20} />
              </button>
            </div>

            <div className="contact-tabs">
              <button className="tab-button active">Details</button>
              <button className="tab-button">History</button>
              <button className="tab-button">Calls</button>
            </div>

            <div className="contact-details-section">
              <div className="details-card">
                <div className="card-header">
                  <User size={18} />
                  <h3>Personal Information</h3>
                </div>
                
                {!isEditMode ? (
                  <div className="details-grid">
                    <div className="detail-item">
                      <div className="detail-label">First Name:</div>
                      <div className="detail-value">{selectedContact.firstName}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Last Name:</div>
                      <div className="detail-value">{selectedContact.lastName}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Phone Number:</div>
                      <div className="detail-value">{selectedContact.phone}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Email:</div>
                      <div className="detail-value">{selectedContact.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="edit-form">
                    <div className="form-group">
                      <label htmlFor="customer_first_name">First Name *</label>
                      <input
                        type="text"
                        id="customer_first_name"
                        name="customer_first_name"
                        value={editedContact.customer_first_name}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="customer_last_name">Last Name *</label>
                      <input
                        type="text"
                        id="customer_last_name"
                        name="customer_last_name"
                        value={editedContact.customer_last_name}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="edit-phone">Phone Number</label>
                      <input
                        type="tel"
                        id="edit-phone"
                        name="phone number"
                        value={editedContact["phone number"]}
                        onChange={handleEditInputChange}
                        placeholder="Numbers only"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="edit-email">Email</label>
                      <input
                        type="email"
                        id="edit-email"
                        name="Customer Email"
                        value={editedContact["Customer Email"]}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="details-card">
                <div className="card-header">
                  <Briefcase size={18} />
                  <h3>Professional Information</h3>
                </div>
                
                {!isEditMode ? (
                  <div className="details-grid">
                    <div className="detail-item">
                      <div className="detail-label">Company:</div>
                      <div className="detail-value">{selectedContact.company}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Job Title:</div>
                      <div className="detail-value">{selectedContact.title}</div>
                    </div>
                  </div>
                ) : (
                  <div className="edit-form">
                    <div className="form-group">
                      <label htmlFor="edit-company">Company</label>
                      <input
                        type="text"
                        id="edit-company"
                        name="Company"
                        value={editedContact["Company"]}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="edit-title">Job Title</label>
                      <input
                        type="text"
                        id="edit-title"
                        name="Title"
                        value={editedContact["Title"]}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="details-card">
                <div className="card-header">
                  <FileText size={18} />
                  <h3>Notes</h3>
                </div>
                
                <div className="notes-content">
                  {selectedContact.notes || "No notes available for this contact."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Contact</h2>
              <button className="close-modal-button" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}
            
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="customer_first_name">First Name *</label>
                <input
                  type="text"
                  id="customer_first_name"
                  name="customer_first_name"
                  value={newContact.customer_first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="customer_last_name">Last Name *</label>
                <input
                  type="text"
                  id="customer_last_name"
                  name="customer_last_name"
                  value={newContact.customer_last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="Customer Email">Email</label>
                <input
                  type="email"
                  id="Customer Email"
                  name="Customer Email"
                    value={newContact["Customer Email"]}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone number">Phone Number</label>
                  <input
                    type="tel"
                    id="phone number"
                    name="phone number"
                    value={newContact["phone number"]}
                    onChange={handleInputChange}
                    placeholder="Numbers only"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="Company">Company</label>
                  <input
                    type="text"
                    id="Company"
                    name="Company"
                    value={newContact["Company"]}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="Title">Job Title</label>
                  <input
                    type="text"
                    id="Title"
                    name="Title"
                    value={newContact["Title"]}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-button" 
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showDeleteModal && (
          <div 
            className="delete-modal"
            style={{
              top: deleteModalPosition.top,
              left: deleteModalPosition.left,
            }}
          >
            <div className="delete-modal-header">
              <h3>Delete Contact</h3>
              <button className="close-modal-button" onClick={handleCloseDeleteModal}>
                <X size={16} />
              </button>
            </div>
            
            {deleteError && (
              <div className="error-message">
                {deleteError}
              </div>
            )}
            
            {deleteSuccess && (
              <div className="success-message">
                {deleteSuccess}
              </div>
            )}
            
            <p>Are you sure you want to delete {selectedContact.name}?</p>
            <p className="warning-text">This action cannot be undone.</p>
            
            <div className="delete-actions">
              <button 
                className="cancel-button" 
                onClick={handleCloseDeleteModal}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-button"
                onClick={handleDeleteContact}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Customers;
                    