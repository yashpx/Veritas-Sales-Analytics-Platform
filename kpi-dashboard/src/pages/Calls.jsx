import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // Adjust the import path as needed
import { Phone, Mail, ChevronLeft, Edit, Search } from 'lucide-react';
import './Calls.css';

const supabaseUrl = 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';
const supabase = createClient(supabaseUrl, supabaseKey);

const Calls = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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
        
        // Simulate some fields that might come from other tables
        // In a real app, you would join with those tables
        return {
          id: customer.customer_id,
          name: `${customer.customer_first_name} ${customer.customer_last_name}`,
          firstName: customer.customer_first_name,
          lastName: customer.customer_last_name,
          phone: generatePhoneNumber(), // Simulated for demo
          email: `${customer.customer_first_name.toLowerCase()}${customer.customer_last_name.toLowerCase()}@gmail.com`, // Simulated
          company: getRandomCompany(), // Simulated
          title: getRandomTitle(), // Simulated
          status: latestCall?.call_outcome || 'No Account Created',
          header: generatePhoneNumber(), // Simulated
          state: latestCall ? 'Client' : 'No Account Created',
          calls: calls,
          notes: "• Team Size: 10 sales reps\n• Goal: Boost lead conversions and automate tasks\n• Key Questions: CRM integrations, pricing for 10 users, free trial"
        };
      });

      setContacts(transformedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
    }
  };

  // Helper functions to generate dummy data for demo
  const generatePhoneNumber = () => {
    const prefixes = ['+1', '+44', '+971', '+61'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`.substring(0, 16);
  };

  const getRandomCompany = () => {
    const companies = ['Google', 'Oracle', 'Tech Innovators', 'Silicon Valley Solutions', 'CloudTech', 'AI Habtoor Motors', 'CodeSphere', 'QuantumTech'];
    return companies[Math.floor(Math.random() * companies.length)];
  };

  const getRandomTitle = () => {
    const titles = ['Project Manager', 'DevOps', 'HR Manager', 'Software Eng', 'Product Manager', 'CTO', 'Backend Dev', 'HR'];
    return titles[Math.floor(Math.random() * titles.length)];
  };

  const handleFilterClick = (newFilter) => {
    setFilter(newFilter);
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
  };

  const handleBackClick = () => {
    setSelectedContact(null);
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
        contact.title.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  return (
    <div className="calls-container">
      {!selectedContact ? (
        <>
          
          <div className="contacts-section">
            <h1>Contacts</h1>
            <p>{contacts.length} Total Contacts</p>

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
                  placeholder="Search" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="contacts-table">
              <div className="table-header">
                <div className="table-cell name-cell">Name</div>
                <div className="table-cell">Phone Number</div>
                <div className="table-cell">State</div>
                <div className="table-cell">Company</div>
                <div className="table-cell">Title</div>
                <div className="table-cell call-cell">Call</div>
              </div>
              
              <div className="table-body">
                {loading ? (
                  <div className="loading">Loading contacts...</div>
                ) : (
                  getFilteredContacts().map(contact => (
                    <div 
                      key={contact.id} 
                      className="table-row"
                      onClick={() => handleContactClick(contact)}
                    >
                      <div className="table-cell name-cell">{contact.name}</div>
                      <div className="table-cell">{contact.header}</div>
                      <div className="table-cell">
                        {contact.state === 'Client' && (
                          <span className="status-badge client">
                            <span className="status-dot"></span>
                            Client
                          </span>
                        )}
                        {contact.state !== 'Client' && contact.state}
                      </div>
                      <div className="table-cell">{contact.company}</div>
                      <div className="table-cell">{contact.title}</div>
                      <div className="table-cell call-cell">
                        <button className="call-button">
                          <Phone size={18} />
                        </button>
                        <button className="options-button">
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
            <div className="calls-header">
              <div className="header-item">Recent</div>
              <div className="header-item sortable">Time (EST)</div>
              <div className="header-item">Account Status</div>
              <div className="header-item">Recording</div>
            </div>
            
            <div className="contacts-section">
              <h1>Contacts</h1>
              <p>{contacts.length} Total Contacts</p>

              <div className="filter-section">
                <button 
                  className={`filter-button ${filter === 'All' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('All')}>
                  All
                </button>
                <button 
                  className={`filter-button ${filter === 'Prospect' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('Prospect')}>
                  Prospect
                </button>
                <button 
                  className={`filter-button ${filter === 'Lead' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('Lead')}>
                  Lead
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
                <button 
                  className={`filter-button ${filter === 'First-Time Caller' ? 'active' : ''}`}
                  onClick={() => handleFilterClick('First-Time Caller')}>
                  First-Time Caller
                </button>
                
                <div className="search-container">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="contacts-table">
                <div className="table-header">
                  <div className="table-cell name-cell">Name</div>
                  <div className="table-cell">Header</div>
                  <div className="table-cell">State</div>
                  <div className="table-cell">Company</div>
                  <div className="table-cell">Title</div>
                  <div className="table-cell call-cell">Call</div>
                </div>
                
                <div className="table-body">
                  {getFilteredContacts().map(contact => (
                    <div 
                      key={contact.id} 
                      className={`table-row ${selectedContact && selectedContact.id === contact.id ? 'selected' : ''}`}
                      onClick={() => handleContactClick(contact)}
                    >
                      <div className="table-cell name-cell">{contact.name}</div>
                      <div className="table-cell">{contact.header}</div>
                      <div className="table-cell">
                        {contact.state === 'Client' && (
                          <span className="status-badge client">
                            <span className="status-dot"></span>
                            Client
                          </span>
                        )}
                        {contact.state !== 'Client' && contact.state}
                      </div>
                      <div className="table-cell">{contact.company}</div>
                      <div className="table-cell">{contact.title}</div>
                      <div className="table-cell call-cell">
                        <button className="call-button">
                          <Phone size={18} />
                        </button>
                        <button className="options-button">
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
              <button className="edit-button">
                Edit
                <Edit size={16} />
              </button>
            </div>

            <div className="contact-profile">
              <h2>{selectedContact.name}</h2>
              <div className="profile-badge">
                <span className="status-dot"></span>
                Client
              </div>
            </div>

            <div className="contact-actions">
              <button className="action-button phone-action">
                <Phone size={20} />
              </button>
              <button className="action-button email-action">
                <Mail size={20} />
              </button>
            </div>

            <div className="contact-tabs">
              <button className="tab-button active">Details</button>
              <button className="tab-button">History</button>
            </div>

            <div className="contact-details-section">
              <h3>Personal Information</h3>
              
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
                  <div className="detail-label">Secondary Phone:</div>
                  <div className="detail-value">--</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{selectedContact.email}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Company:</div>
                  <div className="detail-value">{selectedContact.company}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Job Title:</div>
                  <div className="detail-value">{selectedContact.title}</div>
                </div>
              </div>

              <div className="notes-section">
                <h3>Notes:</h3>
                <div className="notes-content">
                  {selectedContact.notes}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calls;