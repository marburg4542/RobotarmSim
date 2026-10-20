import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaLock } from 'react-icons/fa'

const styles = {
  container: {
    width: '90vw', height: '86vh',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  card: {
    width: 380, borderRadius: 16,
    boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
    padding: '40px 30px', textAlign: 'center',
  },
  title: { fontSize: '24px', fontWeight: 700, marginBottom: '24px' },
  inputContainer: { position: 'relative', marginBottom: '16px' },
  icon: {
    position: 'absolute', left: 12, top: '50%',
    transform: 'translateY(-50%)', color: '#aaa'
  },
  input: {
    width: '100%', padding: '12px 12px 12px 40px',
    borderRadius: '30px', border: '1px solid #ddd',
    outline: 'none', fontSize: '14px',
  },
  button: {
    width: '100%', padding: '12px',
    borderRadius: '30px', border: 'none',
    backgroundColor: '#6e38f5', color: '#fff',
    fontWeight: 600, cursor: 'pointer', marginTop: '8px',
  },
  toggleLink: { cursor: 'pointer', color: '#6e38f5', textDecoration: 'none' },
}

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate   = useNavigate()
  const [pwd, setPwd]       = useState('')
  const [confirm, setConfirm] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (pwd !== confirm) {
      return alert('New passwords do not match')
    }
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pwd }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Password has been reset, please log in')
        navigate('/login')
      } else {
        alert(data.message || 'Failed to reset password')
      }
    } catch (err) {
      console.error(err)
      alert('Server error')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputContainer}>
            <FaLock style={styles.icon} />
            <input
              style={styles.input}
              type="password"
              placeholder="New Password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              required
            />
          </div>
          <div style={styles.inputContainer}>
            <FaLock style={styles.icon} />
            <input
              style={styles.input}
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={styles.button}>Reset</button>
        </form>
        <p style={{ marginTop: '16px' }}>
          <span onClick={() => navigate('/login')} style={styles.toggleLink}>
            Back to Login
          </span>
        </p>
      </div>
    </div>
  )
}
