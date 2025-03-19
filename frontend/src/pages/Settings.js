import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Toast from '@radix-ui/react-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import '../styles/settings.css';

// Icon components
const SecurityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2ZM12 22C7.52 20.92 5 16.21 5 12V8.3L12 4.3L19 8.3V12C19 16.21 16.48 20.92 12 22ZM12 13C13.1 13 14 12.1 14 11C14 9.9 13.1 9 12 9C10.9 9 10 9.9 10 11C10 12.1 10.9 13 12 13ZM12 15C10.35 15 8.7 15.56 7.35 16.67C6.98 17.04 6.94 17.67 7.31 18.04C7.68 18.41 8.31 18.37 8.68 18C9.69 17.09 10.84 16.65 12 16.65C13.16 16.65 14.31 17.09 15.32 18C15.69 18.37 16.32 18.41 16.69 18.04C17.06 17.67 17.02 17.04 16.65 16.67C15.3 15.56 13.65 15 12 15Z" fill="currentColor"/>
  </svg>
);

const NotificationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="currentColor"/>
  </svg>
);

const LanguageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V9H11V7ZM14 16C14 16.55 13.55 17 13 17H11C10.45 17 10 16.55 10 16V12C10 11.45 10.45 11 11 11H13C13.55 11 14 11.45 14 12V16Z" fill="currentColor"/>
  </svg>
);

const DisplayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM6.5 11H17.5C18.05 11 18.5 11.45 18.5 12C18.5 12.55 18.05 13 17.5 13H6.5C5.95 13 5.5 12.55 5.5 12C5.5 11.45 5.95 11 6.5 11Z" fill="currentColor"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 1L3.5 6L1.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tab1');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  
  // Display settings
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [theme, setTheme] = useState('light');
  const [compactMode, setCompactMode] = useState(false);

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const handleSaveSettings = () => {
    // In a real application, save settings to your API
    showToast('Settings saved successfully');
  };

  const handleChangePassword = () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('All password fields are required', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    
    // In a real application, change password via your auth system
    showToast('Password changed successfully');
    
    // Clear form
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <DashboardLayout>
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        <div className="settings-card">
          <Tabs.Root 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="settings-tabs"
          >
            <Tabs.List className="settings-tabs-list" aria-label="Settings sections">
              <Tabs.Trigger 
                value="tab1" 
                className="settings-tab" 
                data-state={activeTab === 'tab1' ? 'active' : ''}
              >
                <SecurityIcon />
                <span>Security</span>
              </Tabs.Trigger>
              
              <Tabs.Trigger 
                value="tab2" 
                className="settings-tab"
                data-state={activeTab === 'tab2' ? 'active' : ''}
              >
                <NotificationIcon />
                <span>Notifications</span>
              </Tabs.Trigger>
              
              <Tabs.Trigger 
                value="tab3" 
                className="settings-tab"
                data-state={activeTab === 'tab3' ? 'active' : ''}
              >
                <LanguageIcon />
                <span>Region & Language</span>
              </Tabs.Trigger>
              
              <Tabs.Trigger 
                value="tab4" 
                className="settings-tab"
                data-state={activeTab === 'tab4' ? 'active' : ''}
              >
                <DisplayIcon />
                <span>Display</span>
              </Tabs.Trigger>
            </Tabs.List>

            <div className="settings-tabs-content">
              {/* Security Settings */}
              <Tabs.Content value="tab1" className="settings-tab-content">
                <div className="settings-section">
                  <h2 className="settings-section-title">Security Settings</h2>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="twoFactor">Enable Two-Factor Authentication</label>
                      <p className="settings-option-description">
                        Add an extra layer of security to your account with 2FA
                      </p>
                    </div>
                    <Switch.Root 
                      id="twoFactor"
                      checked={twoFactorEnabled} 
                      onCheckedChange={setTwoFactorEnabled}
                      className="switch-root"
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                  </div>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
                    </div>
                    <div className="select-container">
                      <Select.Root value={sessionTimeout} onValueChange={setSessionTimeout}>
                        <Select.Trigger className="select-trigger" aria-label="Session Timeout">
                          <Select.Value />
                          <Select.Icon className="select-icon">
                            <ChevronDownIcon />
                          </Select.Icon>
                        </Select.Trigger>
                        
                        <Select.Portal>
                          <Select.Content className="select-content">
                            <Select.ScrollUpButton className="select-scroll-button">
                              <ChevronDownIcon style={{ transform: 'rotate(180deg)' }} />
                            </Select.ScrollUpButton>
                            
                            <Select.Viewport className="select-viewport">
                              <Select.Item value="15" className="select-item">
                                <Select.ItemText>15 minutes</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="30" className="select-item">
                                <Select.ItemText>30 minutes</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="60" className="select-item">
                                <Select.ItemText>1 hour</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="120" className="select-item">
                                <Select.ItemText>2 hours</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                            </Select.Viewport>
                            
                            <Select.ScrollDownButton className="select-scroll-button">
                              <ChevronDownIcon />
                            </Select.ScrollDownButton>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  </div>
                  
                  <div className="settings-divider"></div>
                  
                  <h2 className="settings-section-title">Change Password</h2>
                  
                  <div className="settings-form">
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="oldPassword">Current Password</label>
                        <input
                          id="oldPassword"
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row two-columns">
                      <div className="form-field">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="form-field">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="button-primary" 
                      onClick={handleChangePassword}
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </Tabs.Content>

              {/* Notification Settings */}
              <Tabs.Content value="tab2" className="settings-tab-content">
                <div className="settings-section">
                  <h2 className="settings-section-title">Notification Settings</h2>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="emailNotif">Email Notifications</label>
                      <p className="settings-option-description">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch.Root 
                      id="emailNotif"
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications}
                      className="switch-root"
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                  </div>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="pushNotif">Push Notifications</label>
                      <p className="settings-option-description">
                        Receive notifications in your browser
                      </p>
                    </div>
                    <Switch.Root 
                      id="pushNotif"
                      checked={pushNotifications} 
                      onCheckedChange={setPushNotifications}
                      className="switch-root"
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                  </div>
                  
                  <div className="settings-divider"></div>
                  
                  <h2 className="settings-section-title">Report & Digest Settings</h2>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="dailyDigest">Daily Activity Digest</label>
                      <p className="settings-option-description">
                        Receive a summary of daily activities
                      </p>
                    </div>
                    <Switch.Root 
                      id="dailyDigest"
                      checked={dailyDigest} 
                      onCheckedChange={setDailyDigest}
                      className="switch-root"
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                  </div>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="weeklyReport">Weekly Performance Report</label>
                      <p className="settings-option-description">
                        Receive a weekly performance report
                      </p>
                    </div>
                    <Switch.Root 
                      id="weeklyReport"
                      checked={weeklyReport} 
                      onCheckedChange={setWeeklyReport}
                      className="switch-root"
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                  </div>
                </div>
              </Tabs.Content>

              {/* Region & Language Settings */}
              <Tabs.Content value="tab3" className="settings-tab-content">
                <div className="settings-section">
                  <h2 className="settings-section-title">Region & Language Settings</h2>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="language">Language</label>
                    </div>
                    <div className="select-container">
                      <Select.Root value={language} onValueChange={setLanguage}>
                        <Select.Trigger className="select-trigger" aria-label="Language">
                          <Select.Value />
                          <Select.Icon className="select-icon">
                            <ChevronDownIcon />
                          </Select.Icon>
                        </Select.Trigger>
                        
                        <Select.Portal>
                          <Select.Content className="select-content">
                            <Select.Viewport className="select-viewport">
                              <Select.Item value="en" className="select-item">
                                <Select.ItemText>English</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="es" className="select-item">
                                <Select.ItemText>Spanish</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="fr" className="select-item">
                                <Select.ItemText>French</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="de" className="select-item">
                                <Select.ItemText>German</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="zh" className="select-item">
                                <Select.ItemText>Chinese</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  </div>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="timezone">Timezone</label>
                    </div>
                    <div className="select-container">
                      <Select.Root value={timezone} onValueChange={setTimezone}>
                        <Select.Trigger className="select-trigger" aria-label="Timezone">
                          <Select.Value />
                          <Select.Icon className="select-icon">
                            <ChevronDownIcon />
                          </Select.Icon>
                        </Select.Trigger>
                        
                        <Select.Portal>
                          <Select.Content className="select-content">
                            <Select.Viewport className="select-viewport">
                              <Select.Item value="UTC" className="select-item">
                                <Select.ItemText>UTC</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="EST" className="select-item">
                                <Select.ItemText>Eastern Time (EST)</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="CST" className="select-item">
                                <Select.ItemText>Central Time (CST)</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="MST" className="select-item">
                                <Select.ItemText>Mountain Time (MST)</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="PST" className="select-item">
                                <Select.ItemText>Pacific Time (PST)</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  </div>
                  
                  <div className="settings-info-alert">
                    Changing your language preference will take effect after you refresh the page.
                  </div>
                </div>
              </Tabs.Content>

              {/* Display Settings */}
              <Tabs.Content value="tab4" className="settings-tab-content">
                <div className="settings-section">
                  <h2 className="settings-section-title">Display Settings</h2>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="theme">Theme</label>
                    </div>
                    <div className="select-container">
                      <Select.Root value={theme} onValueChange={setTheme}>
                        <Select.Trigger className="select-trigger" aria-label="Theme">
                          <Select.Value />
                          <Select.Icon className="select-icon">
                            <ChevronDownIcon />
                          </Select.Icon>
                        </Select.Trigger>
                        
                        <Select.Portal>
                          <Select.Content className="select-content">
                            <Select.Viewport className="select-viewport">
                              <Select.Item value="light" className="select-item">
                                <Select.ItemText>Light</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="dark" className="select-item">
                                <Select.ItemText>Dark</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                              
                              <Select.Item value="system" className="select-item">
                                <Select.ItemText>System Default</Select.ItemText>
                                <Select.ItemIndicator className="select-item-indicator">
                                  <CheckIcon />
                                </Select.ItemIndicator>
                              </Select.Item>
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  </div>
                  
                  <div className="settings-option">
                    <div className="settings-option-label">
                      <label htmlFor="compactMode">Compact Mode</label>
                      <p className="settings-option-description">
                        Use compact spacing between elements
                      </p>
                    </div>
                    <Switch.Root 
                      id="compactMode"
                      checked={compactMode} 
                      onCheckedChange={setCompactMode}
                      className="switch-root"
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                  </div>
                </div>
              </Tabs.Content>
            </div>

            <div className="settings-footer">
              <button 
                className="button-primary" 
                onClick={handleSaveSettings}
              >
                Save Settings
              </button>
            </div>
          </Tabs.Root>
        </div>
      </div>

      {/* Toast notifications */}
      <Toast.Provider swipeDirection="right">
        <Toast.Root 
          className={`toast ${toastType === 'error' ? 'toast-error' : 'toast-success'}`}
          open={toastOpen}
          onOpenChange={setToastOpen}
          duration={5000}
        >
          <Toast.Title className="toast-title">
            {toastType === 'error' ? 'Error' : 'Success'}
          </Toast.Title>
          <Toast.Description className="toast-description">
            {toastMessage}
          </Toast.Description>
          <Toast.Action className="toast-action" asChild altText="Close">
            <button className="toast-close-button">×</button>
          </Toast.Action>
        </Toast.Root>
        
        <Toast.Viewport className="toast-viewport" />
      </Toast.Provider>
    </DashboardLayout>
  );
};

export default Settings;