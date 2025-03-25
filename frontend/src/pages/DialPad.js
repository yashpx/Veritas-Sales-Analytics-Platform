import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import supabase from '../utils/supabaseClient';
import { Search, Phone, User, X, Clock, Users, BookOpen, List, BarChart, ChevronLeft } from 'lucide-react';
import '../styles/dialpad.css';

// Define Supabase URL and key from environment variables or defaults
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://coghrwmmyyzmbnndlawi.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2hyd21teXl6bWJubmRsYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTcyMjUsImV4cCI6MjA1NjQ3MzIyNX0.WLm0l2UeFPiPNxyClnM4bQpxw4TcYFxleTdc7K0G6AM';

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
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [callLogged, setCallLogged] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  
  // Audio references
  const dialToneRef = useRef(null);
  const connectToneRef = useRef(null);
  const endToneRef = useRef(null);
  const keypadToneRef = useRef(null);

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

    // Fetch recent calls
    const fetchRecentCalls = async () => {
      try {
        const { data, error } = await supabase
          .from('call_logs')
          .select(`
            call_id,
            call_date,
            duration_minutes,
            customers (
              customer_id,
              customer_first_name,
              customer_last_name,
              "phone number"
            )
          `)
          .order('call_date', { ascending: false })
          .limit(5);

        if (error) throw error;

        const recentCallsData = data.map(call => ({
          id: call.call_id,
          date: new Date(call.call_date),
          duration: call.duration_minutes,
          customerName: call.customers ? `${call.customers.customer_first_name} ${call.customers.customer_last_name}` : 'Unknown',
          phoneNumber: call.customers?.phone_number || '',
          customerId: call.customers?.customer_id || null
        }));

        setRecentCalls(recentCallsData);
      } catch (error) {
        console.error('Error fetching recent calls:', error);
      }
    };

    if (user) {
      fetchContacts();
      fetchRecentCalls();
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
  
  // Initialize audio elements
  useEffect(() => {
    // Function to safely play audio
    const safelyPlayAudio = async (audioRef) => {
      if (!audioRef.current) return;
      
      try {
        // Reset the audio first to prevent play/pause conflicts
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        
        // Use the play promise to handle errors properly
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // Auto-play was prevented or another error occurred
            console.log("Audio play prevented:", error);
          });
        }
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    };
    
    // Attach the safelyPlayAudio method to each audio element
    if (dialToneRef.current) dialToneRef.current.safelyPlay = () => safelyPlayAudio(dialToneRef);
    if (connectToneRef.current) connectToneRef.current.safelyPlay = () => safelyPlayAudio(connectToneRef);
    if (endToneRef.current) endToneRef.current.safelyPlay = () => safelyPlayAudio(endToneRef);
    if (keypadToneRef.current) keypadToneRef.current.safelyPlay = () => safelyPlayAudio(keypadToneRef);
    
    setAudioReady(true);
  }, []);

  const handleDigitClick = (digit) => {
    setPhoneNumber(prev => prev + digit);
    
    // Play keypad tone
    if (audioReady && keypadToneRef.current && keypadToneRef.current.safelyPlay) {
      keypadToneRef.current.safelyPlay();
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };
  
  const handleContactSelect = (contact) => {
    setPhoneNumber(contact.phone);
    setSelectedContact(contact);
    setShowContactsModal(false);
  };

  const handleRecentCallSelect = (call) => {
    // Find the contact associated with this call
    const contact = contacts.find(c => c.id === call.customerId);
    if (contact) {
      handleContactSelect(contact);
    } else if (call.phoneNumber) {
      setPhoneNumber(call.phoneNumber);
    }
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
      
      // Play dial tone
      if (audioReady && dialToneRef.current && dialToneRef.current.safelyPlay) {
        dialToneRef.current.safelyPlay();
      }
      
      // Generate a call ID for reference (simulating an actual call service)
      const callId = `call_${Math.random().toString(36).substring(2, 11)}`;
      console.log('Simulated call initiated with ID:', callId);
      
      // For demo purposes, simulate connection after 2 seconds
      setTimeout(() => {
        // Stop dial tone
        if (dialToneRef.current) {
          dialToneRef.current.pause();
          dialToneRef.current.currentTime = 0;
        }
        
        // Play connect tone
        if (audioReady && connectToneRef.current && connectToneRef.current.safelyPlay) {
          connectToneRef.current.safelyPlay();
        }
        
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
      
      // Stop any playing audio
      if (dialToneRef.current) {
        dialToneRef.current.pause();
        dialToneRef.current.currentTime = 0;
      }
    }
  };

  const handleEndCall = async () => {
    try {
      // End the simulated call
      console.log('Simulated call ended');
      
      // Stop any ongoing call audio
      if (dialToneRef.current) {
        dialToneRef.current.pause();
        dialToneRef.current.currentTime = 0;
      }
      
      if (connectToneRef.current) {
        connectToneRef.current.pause();
        connectToneRef.current.currentTime = 0;
      }
      
      // Play end call tone
      if (audioReady && endToneRef.current && endToneRef.current.safelyPlay) {
        endToneRef.current.safelyPlay();
      }
      
      setCallStatus('ended');
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Find the selected contact data (for customer details)
      const selectedContact = contacts.find(c => c.phone === phoneNumber);
      
      try {
        console.log('Logging call to Supabase');
        
        // Get or determine sales rep ID
        let salesRepId;
        
        if (user.salesRepId) {
          salesRepId = user.salesRepId;
        } else {
          // Look up sales rep by user ID or email
          let salesRepQuery;
          
          if (user.id) {
            salesRepQuery = await supabase
              .from('sales_reps')
              .select('sales_rep_id')
              .eq('user_id', user.id)
              .single();
              
            if (salesRepQuery.data) {
              salesRepId = salesRepQuery.data.sales_rep_id;
            }
          }
          
          // If not found and we have email, try that
          if (!salesRepId && user.email) {
            salesRepQuery = await supabase
              .from('sales_reps')
              .select('sales_rep_id')
              .eq('Email', user.email)
              .single();
              
            if (salesRepQuery.data) {
              salesRepId = salesRepQuery.data.sales_rep_id;
            }
          }
          
          // If still not found, create a new sales rep
          if (!salesRepId) {
            const { data: newRep } = await supabase
              .from('sales_reps')
              .insert([{
                sales_rep_first_name: user.email?.split('@')[0] || 'New',
                sales_rep_last_name: 'User',
                "Email": user.email,
                user_id: user.id
              }])
              .select();
              
            if (newRep && newRep.length > 0) {
              salesRepId = newRep[0].sales_rep_id;
            } else {
              // Fallback
              salesRepId = 1;
            }
          }
        }
        
        // Get or determine customer ID
        let customerId;
        
        if (selectedContact && selectedContact.id) {
          customerId = selectedContact.id;
        } else {
          // Look for customer with this phone number
          const { data: customer } = await supabase
            .from('customers')
            .select('customer_id')
            .eq('phone number', phoneNumber.toString())
            .maybeSingle();
            
          if (customer) {
            customerId = customer.customer_id;
          } else {
            // Create new customer
            const { data: newCustomer } = await supabase
              .from('customers')
              .insert([{
                customer_first_name: 'Unknown',
                customer_last_name: 'Customer',
                "phone number": parseInt(phoneNumber, 10) || null
              }])
              .select();
              
            if (newCustomer && newCustomer.length > 0) {
              customerId = newCustomer[0].customer_id;
            } else {
              // Fallback
              customerId = 1;
            }
          }
        }
        
        // Calculate duration in minutes (minimum 1 minute)
        const durationMinutes = Math.max(1, Math.ceil(callDuration / 60));
        
        // Create single call log entry
        const callLogEntry = {
          sales_rep_id: salesRepId,
          customer_id: customerId,
          call_date: new Date().toISOString(),
          duration_minutes: durationMinutes,
          call_outcome: 'In-progress', // Valid enum value
          notes: null,
          transcription: null,
          "Sentiment Result": null
        };
        
        console.log('Inserting single call log entry:', callLogEntry);
        
        // Make a single database insert
        const { data, error } = await supabase
          .from('call_logs')
          .insert([callLogEntry])
          .select();
          
        if (error) {
          throw error;
        }
        
        console.log('Call logged successfully:', data);
        setCallLogged(true);
        setTimeout(() => {
          setCallLogged(false);
        }, 5000);
        
        // Add to recent calls
        const newRecentCall = {
          id: data[0].call_id,
          date: new Date(),
          duration: durationMinutes,
          customerName: selectedContact ? selectedContact.name : 'Unknown',
          phoneNumber: phoneNumber,
          customerId: customerId
        };
        
        setRecentCalls(prev => [newRecentCall, ...prev.slice(0, 4)]);
        
      } catch (dbError) {
        console.error('Failed to log call to database:', dbError);
        
        // Fallback to localStorage
        try {
          console.log('Using localStorage fallback to record the call');
          
          // Create a simplified call log entry for localStorage
          const callLogEntry = {
            phoneNumber: phoneNumber,
            contact: selectedContact ? selectedContact.name : 'Unknown',
            date: new Date().toISOString(),
            duration: Math.max(1, Math.ceil(callDuration / 60)),
            outcome: 'In-progress'
          };
          
          // Get existing logs or initialize an empty array
          const storedLogs = JSON.parse(localStorage.getItem('callLogs') || '[]');
          
          // Add this call log
          storedLogs.push({
            ...callLogEntry,
            id: Date.now()
          });
          
          // Save to localStorage
          localStorage.setItem('callLogs', JSON.stringify(storedLogs));
          console.log('Call saved to localStorage successfully');
          
          // Show success message
          setCallLogged(true);
          setTimeout(() => {
            setCallLogged(false);
          }, 5000);
        } catch (localStorageErr) {
          console.error('Even localStorage fallback failed:', localStorageErr);
          alert('Failed to log call. Please try again later.');
        }
      }
      
      console.log(`Call ended. Duration: ${formatTime(callDuration)}`);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCallStatus('idle');
        setCallDuration(0);
      }, 2000);
    } catch (error) {
      console.error('Error ending call:', error);
      // Still end the call UI even if something fails
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

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
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

  const renderQuickActions = () => {
    return (
      <div className="quick-actions-grid">
        <button className="quick-action-button" onClick={() => setShowContactsModal(true)}>
          <Users size={20} />
          <span>Contacts</span>
        </button>
        <button className="quick-action-button">
          <Clock size={20} />
          <span>Recent</span>
        </button>
        <button className="quick-action-button">
          <BookOpen size={20} />
          <span>Voicemail</span>
        </button>
        <button className="quick-action-button">
          <List size={20} />
          <span>Call Log</span>
        </button>
      </div>
    );
  };

  const renderRecentCalls = () => {
    if (recentCalls.length === 0) {
      return (
        <div className="recent-calls-empty">
          <p>No recent calls</p>
        </div>
      );
    }

    return (
      <div className="recent-calls-list">
        {recentCalls.map(call => (
          <div key={call.id} className="recent-call-item" onClick={() => handleRecentCallSelect(call)}>
            <div className="recent-call-avatar">
              <Phone size={16} />
            </div>
            <div className="recent-call-info">
              <div className="recent-call-name">{call.customerName}</div>
              <div className="recent-call-details">
                <span>{formatDate(call.date)}</span>
                <span className="recent-call-duration">{call.duration} min</span>
              </div>
            </div>
            <button 
              className="recent-call-action"
              onClick={(e) => {
                e.stopPropagation();
                call.phoneNumber && setPhoneNumber(call.phoneNumber);
                setTimeout(() => handleStartCall(), 100);
              }}
            >
              <Phone size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Render contacts modal
  const renderContactsModal = () => {
    if (!showContactsModal) return null;

    return (
      <div className="contacts-modal-overlay">
        <div className="contacts-modal">
          <div className="contacts-modal-header">
            <button className="back-button" onClick={() => setShowContactsModal(false)}>
              <ChevronLeft size={16} />
              Back
            </button>
            <h2>Select Contact</h2>
            <button className="close-modal-button" onClick={() => setShowContactsModal(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="contacts-modal-search">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
          </div>
          
          <div className="contacts-modal-list">
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
                  className="contact-modal-item"
                  onClick={() => handleContactSelect(contact)}
                >
                  <div className="contact-modal-avatar">
                    {contact.firstName?.[0]}{contact.lastName?.[0]}
                  </div>
                  <div className="contact-modal-info">
                    <div className="contact-modal-name">{contact.name}</div>
                    <div className="contact-modal-details">
                      <span>{contact.phone}</span>
                      {contact.company !== 'Not specified' && (
                        <span className="contact-modal-company">{contact.company}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    className="contact-modal-call"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContactSelect(contact);
                      setTimeout(() => handleStartCall(), 100);
                    }}
                  >
                    <Phone size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Hidden audio elements */}
      <audio ref={dialToneRef} preload="auto">
        <source src="/assets/audio/dial-tone.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={connectToneRef} preload="auto">
        <source src="/assets/audio/connect-tone.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={endToneRef} preload="auto">
        <source src="/assets/audio/end-tone.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={keypadToneRef} preload="auto">
        <source src="/assets/audio/keypad-tone.mp3" type="audio/mpeg" />
      </audio>
      
      <div className="dialpad-bento-container">
        <div className="dialpad-bento-header">
          <h1>Dial Pad</h1>
          <p>Make calls and manage contacts</p>
        </div>
        
        <div className="dialpad-bento-grid">
          {/* Main Dialer Box */}
          <div className="bento-box dialer-box">
            <div className="dialer-contact-display">
              {selectedContact ? (
                <div className="selected-contact">
                  <div className="contact-avatar">
                    {selectedContact.firstName?.[0]}{selectedContact.lastName?.[0]}
                  </div>
                  <div className="contact-info">
                    <h3>{selectedContact.name}</h3>
                    {selectedContact.company !== 'Not specified' && <p>{selectedContact.company}</p>}
                  </div>
                  <button className="clear-contact" onClick={() => setSelectedContact(null)}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button className="select-contact-button" onClick={() => setShowContactsModal(true)}>
                  <Users size={20} />
                  <span>Select Contact</span>
                </button>
              )}
            </div>
            
            <div className="phone-display">
              <input
                type="text"
                className="phone-input"
                style={{ 
                  width: phoneNumber && callStatus === 'idle' ? 'calc(100% - 40px)' : '100%' 
                }}
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
            
            {callStatus === 'ended' && (
              <div className="call-ended">
                <p>Call ended</p>
                <p className="timer final-time">{formatTime(callDuration)}</p>
              </div>
            )}
            
            {callLogged && (
              <div className="call-logged-success">
                <p>✓ Call successfully logged to database</p>
              </div>
            )}

            {renderDialPad()}

            <div className="call-controls">
              {(callStatus === 'idle' || callStatus === 'ended') ? (
                <button 
                  className="call-button" 
                  onClick={handleStartCall}
                  disabled={!phoneNumber || phoneNumber.length < 10}
                >
                  <Phone size={20} />
                  Call
                </button>
              ) : (
                <button 
                  className="end-call-button" 
                  onClick={handleEndCall}
                >
                  End Call
                </button>
              )}
            </div>
          </div>
          
          {/* Contacts Box (renamed from Recent Calls) */}
          <div className="bento-box contacts-box">
            <h3>Contacts</h3>
            <button 
              className="view-all-contacts-btn" 
              onClick={() => setShowContactsModal(true)}
            >
              <Users size={16} />
              <span>View All Contacts</span>
            </button>
            {renderRecentCalls()}
          </div>
        </div>
      </div>
      
      {renderContactsModal()}
    </DashboardLayout>
  );
};

export default DialPad;