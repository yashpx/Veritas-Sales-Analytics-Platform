import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    // Check for an existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkUser();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <img src="/assets/Logo.png" alt="Logo" />
          <span>Veritas</span>
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              <span className="welcome-text">
                {user.email}
              </span>
              <Link to="/dashboard">Dashboard</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;