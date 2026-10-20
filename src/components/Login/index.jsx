// src/components/Login/index.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaLock, FaEnvelope, FaLockOpen } from 'react-icons/fa';
import { AuthContext } from '../../App';

const styles = {
  container: {
    width: '90vw',
    height: '86vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 380,
    borderRadius: 16,
    boxShadow: '1px 1px 30px rgba(0,0,0,0.5)',
    padding: '40px 30px',
    textAlign: 'center',
    transform: 'translate(60px, 0px)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: '16px',
  },
  icon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#aaa',
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '30px',
    border: '1px solid #ddd',
    outline: 'none',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: '30px',
    border: 'none',
    backgroundColor: '#6e38f5',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  linkContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '14px',
  },
  toggleLink: {
    cursor: 'pointer',
    color: '#6e38f5',
    textDecoration: 'none',
    fontWeight: 500,
  },
  smallLink: {
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: '14px',
  },
};

export default function LoginPage() {
  const { setIsAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // load saved credentials for "remember me"
  const savedCreds = JSON.parse(localStorage.getItem('credentials') || '{}');

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [username, setUsername] = useState(savedCreds.username || '');
  const [password, setPassword] = useState(savedCreds.password || '');
  const [remember, setRemember] = useState(!!savedCreds.username);

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot password field
  const [email, setEmail] = useState('');

  // ensure inputs are pre-filled if saved
  useEffect(() => {
    if (savedCreds.username) {
      setUsername(savedCreds.username);
      setPassword(savedCreds.password || '');
      setRemember(true);
    }
  }, []);

  // 1) Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        // save or clear credentials
        if (remember) {
          localStorage.setItem(
            'credentials',
            JSON.stringify({ username, password })
          );
        } else {
          localStorage.removeItem('credentials');
        }
        // store JWT & user info in sessionStorage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem(
          'currentUser',
          JSON.stringify({ username: data.username, avatarUrl: data.avatarUrl })
        );
        setIsAuthenticated(true);
        navigate('/homepage');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Unable to connect to server');
    }
  };

  // 2) Register
  const handleRegister = async (e) => {
    e.preventDefault();
    if (regPassword !== confirmPassword) {
      return alert('Passwords do not match');
    }
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Registration successful! Please log in.');
        setMode('login');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Unable to connect to server');
    }
  };

  // 3) Forgot Password
  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Password reset link has been sent via email');
        setMode('login');
      } else {
        alert(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      console.error(err);
      alert('Unable to connect to server');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {mode === 'login' && (
          <>
            <h2 style={styles.title}>Login</h2>
            <form onSubmit={handleLogin}>
              <div style={styles.inputContainer}>
                <FaUserAlt style={styles.icon} />
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div style={styles.inputContainer}>
                <FaLock style={styles.icon} />
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div style={styles.linkContainer}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember(r => !r)}
                    style={{ marginRight: '8px' }}
                  />
                  remember me
                </label>
                <span
                  onClick={() => setMode('forgot')}
                  style={styles.smallLink}
                >
                  forgot password
                </span>
              </div>
              <button type="submit" style={styles.button}>
                Login
              </button>
            </form>
            <p style={{ marginTop: '16px', fontSize: '14px' }}>
              Don't have an account?{' '}
              <span
                onClick={() => setMode('register')}
                style={styles.toggleLink}
              >
                Create Account
              </span>
            </p>
          </>
        )}

        {mode === 'register' && (
          <>
            <h2 style={styles.title}>Register</h2>
            <form onSubmit={handleRegister}>
              <div style={styles.inputContainer}>
                <FaUserAlt style={styles.icon} />
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Username"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  required
                />
              </div>
              <div style={styles.inputContainer}>
                <FaEnvelope style={styles.icon} />
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div style={styles.inputContainer}>
                <FaLockOpen style={styles.icon} />
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  required
                />
              </div>
              <div style={styles.inputContainer}>
                <FaLockOpen style={styles.icon} />
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" style={styles.button}>
                Register
              </button>
            </form>
            <p style={{ marginTop: '16px', fontSize: '14px' }}>
              Already have an account?{' '}
              <span
                onClick={() => setMode('login')}
                style={styles.toggleLink}
              >
                Login
              </span>
            </p>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h2 style={styles.title}>Forgot Password</h2>
            <form onSubmit={handleForgot}>
              <div style={styles.inputContainer}>
                <FaEnvelope style={styles.icon} />
                <input
                  style={styles.input}
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" style={styles.button}>
                Send Reset Link
              </button>
            </form>
            <p style={{ marginTop: '16px', fontSize: '14px' }}>
              Remembered?{' '}
              <span
                onClick={() => setMode('login')}
                style={styles.toggleLink}
              >
                Back to Login
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
