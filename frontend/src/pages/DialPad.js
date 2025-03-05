import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import twilioApiClient from '../utils/twilioApiClient';
import supabase from '../utils/supabaseClient';
import { Search, Phone, User } from 'lucide-react';
import '../styles/dialpad.css';

const DialPad = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if a number was passed via state
  useEffect(() => {
    if (location.state && location.state.phoneNumber) {
      setPhoneNumber(location.state.phoneNumber);
    }
  }, [location.state]);

  // Handle auth redirect
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('customers')
          .select(`
            customer_id,
            customer_first_name,
            customer_last_name,
            "Customer Email",
            "Company",
            "Title",
            "phone number"
          `)
          .order('customer_last_name', { ascending: true });

        if (error) throw error;

        // Transform the data
        const transformedData = data.map(customer => ({
          id: customer.customer_id,
          name: `${customer.customer_first_name} ${customer.customer_last_name}`,
          firstName: customer.customer_first_name,
          lastName: customer.customer_last_name,
          phone: customer["phone number"] ? `${customer["phone number"]}` : '',
          email: customer["Customer Email"] || '',
          company: customer["Company"] || 'Not specified',
        })).filter(contact => contact.phone); // Only include contacts with phone numbers

        setContacts(transformedData);
        setFilteredContacts(transformedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchContacts();
    }
  }, [user]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const handleDigitClick = (digit) => {
    setPhoneNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };
  
  const handleContactSelect = (contact) => {
    setPhoneNumber(contact.phone);
  };
  
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        contact.phone.includes(query) ||
        (contact.company && contact.company.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredContacts(filtered);
    }
  };

  const handleStartCall = async () => {
    if (phoneNumber.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    try {
      setCallStatus('calling');
      // Call Twilio API to initiate call
      const response = await twilioApiClient.startCall(phoneNumber);
      
      // Store call ID for future reference
      const callId = response.callId;
      
      // For demo purposes, simulate connection after 2 seconds
      setTimeout(() => {
        setCallStatus('connected');
        // Start call timer
        const interval = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
        setTimerInterval(interval);
      }, 2000);
    } catch (error) {
      console.error('Failed to initiate call:', error);
      setCallStatus('idle');
    }
  };

  const handleEndCall = async () => {
    try {
      // End the call via Twilio API
      await twilioApiClient.endCall();
      
      setCallStatus('ended');
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Log the call to database
      await twilioApiClient.logCall({
        phoneNumber: phoneNumber,
        duration: callDuration,
        status: 'completed'
      });
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCallStatus('idle');
        setCallDuration(0);
      }, 2000);
    } catch (error) {
      console.error('Error ending call:', error);
      // Still end the call UI even if API fails
      setCallStatus('idle');
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      setCallDuration(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderDialPad = () => {
    const digits = [
      '1', '2', '3',
      '4', '5', '6',
      '7', '8', '9',
      '*', '0', '#'
    ];

    return (
      <div className="dialpad-grid">
        {digits.map(digit => (
          <button 
            key={digit} 
            className="dialpad-button"
            onClick={() => handleDigitClick(digit)}
            disabled={callStatus === 'calling' || callStatus === 'connected'}
          >
            {digit}
          </button>
        ))}
      </div>
    );
  };

  // Render contact list
  const renderContactsList = () => {
    return (
      <div className="contacts-sidebar">
        <div className="contacts-header">
          <h2>Contacts</h2>
          <div className="contacts-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="contacts-list">
          {loading ? (
            <div className="contacts-loading">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="no-contacts">
              {searchQuery 
                ? 'No contacts match your search' 
                : 'No contacts with phone numbers found'}
            </div>
          ) : (
            filteredContacts.map(contact => (
              <div 
                key={contact.id}
                className="contact-item"
                onClick={() => handleContactSelect(contact)}
              >
                <div className="contact-avatar">
                  <User size={16} />
                </div>
                <div className="contact-info">
                  <div className="contact-name">{contact.name}</div>
                  <div className="contact-number">{contact.phone}</div>
                </div>
                <button 
                  className="contact-call-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContactSelect(contact);
                    // Short delay to allow UI to update before call
                    setTimeout(() => handleStartCall(), 100);
                  }}
                >
                  <Phone size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="dialpad-page">
        <div className="dialpad-page-header">
          <div className="header-left">
            <h1>Dial Pad</h1>
            <p>Make calls and manage contacts</p>
          </div>
        </div>
        
        <div className="dialpad-page-content">
          <div className="dialpad-section">
            <Card className="dialpad-card">
              <div className="phone-display">
                <input
                  type="text"
                  className="phone-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9*#]/g, ''))}
                  placeholder="Enter phone number"
                  disabled={callStatus === 'calling' || callStatus === 'connected'}
                />
                {phoneNumber && callStatus === 'idle' && (
                  <button className="backspace-button" onClick={handleBackspace}>
                    <span className="backspace-icon">⌫</span>
                  </button>
                )}
              </div>

              {callStatus === 'connected' && (
                <div className="call-timer">
                  <p>Call in progress</p>
                  <p className="timer">{formatTime(callDuration)}</p>
                </div>
              )}
              
              {callStatus === 'calling' && (
                <div className="call-status">
                  <p>Calling...</p>
                  <div className="calling-animation">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </div>
              )}

              {renderDialPad()}

              <div className="call-controls">
                {(callStatus === 'idle' || callStatus === 'ended') ? (
                  <Button 
                    className="call-button" 
                    onClick={handleStartCall}
                    disabled={!phoneNumber || phoneNumber.length < 10}
                  >
                    Call
                  </Button>
                ) : (
                  <Button 
                    className="end-call-button" 
                    onClick={handleEndCall}
                  >
                    End Call
                  </Button>
                )}
              </div>
            </Card>
          </div>
          
          <div className="contacts-section">
            <div className="contacts-header">
              <div className="header-content">
                <h2>Contacts</h2>
                <p>{contacts.length} Total Contacts</p>
              </div>
              <div className="search-container">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Search contacts..." 
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="contacts-table">
              <div className="table-header">
                <div className="table-cell name-cell">Name</div>
                <div className="table-cell">Phone Number</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Company</div>
                <div className="table-cell call-cell">Action</div>
              </div>
              
              <div className="table-body">
                {loading ? (
                  <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading contacts...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="no-results">
                    <p>No contacts found. Try adjusting your search.</p>
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <div 
                      key={contact.id} 
                      className="table-row"
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="table-cell name-cell">{contact.name}</div>
                      <div className="table-cell">{contact.phone}</div>
                      <div className="table-cell email-cell">{contact.email}</div>
                      <div className="table-cell">{contact.company}</div>
                      <div className="table-cell call-cell">
                        <button 
                          className="call-action-button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactSelect(contact);
                            // Short delay to allow UI to update before call
                            setTimeout(() => handleStartCall(), 100);
                          }}
                        >
                          <Phone size={18} />
                          Call
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DialPad;