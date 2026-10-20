import React, { useState } from 'react';

export default function SettingsPage() {
  // Retrieve user & token from sessionStorage
  const stored = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  const token  = sessionStorage.getItem('token');

  // State
  const [avatarFile, setAvatarFile]           = useState(null);
  const [avatarPreview, setAvatarPreview]     = useState(stored.avatarUrl || '');
  const [username, setUsername]               = useState(stored.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage]                 = useState('');

  // Preview avatar
  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Submit profile update
  const handleProfileSubmit = async e => {
    e.preventDefault();
    if (!token) {
      setMessage('Please log in again');
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    if (avatarFile) formData.append('avatar', avatarFile);

    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        // Update sessionStorage
        const updated = { username: data.username, avatarUrl: data.avatarUrl };
        sessionStorage.setItem('currentUser', JSON.stringify(updated));
        setAvatarPreview(data.avatarUrl);
        setMessage('Profile updated successfully');
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
    }
  };

  // Submit password change
  const handlePasswordSubmit = async e => {
    e.preventDefault();
    if (!token) {
      setMessage('Please log in again');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold text-center mb-6">Settings</h1>

      {message && (
        <div className="p-3 bg-red-100 rounded text-black mb-6">{message}</div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Profile Settings */}
        <form
          onSubmit={handleProfileSubmit}
          className="flex-1 space-y-6 p-6 shadow rounded-lg"
        >
          <h2 className="text-xl font-semibold">Profile Settings</h2>

          <div className="form-control">
            <label className="label">Avatar</label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-gray-500 flex items-center justify-center h-full">
                    {stored.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="file-input file-input-bordered file-input-sm"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="input input-bordered"
              style={{ width: '200px', marginLeft: '1rem' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Save Profile
          </button>
        </form>

        {/* Password Settings */}
        <form
          onSubmit={handlePasswordSubmit}
          className="flex-1 space-y-6 p-6 shadow rounded-lg"
        >
          <h2 className="text-xl font-semibold">Password Settings</h2>

          <div className="form-control">
            <label className="label">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input input-bordered"
              style={{ width: '200px', marginLeft: '1rem' }}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input input-bordered"
              style={{ width: '200px', marginLeft: '1rem' }}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input input-bordered"
              style={{ width: '200px', marginLeft: '1rem' }}
              required
            />
          </div>

          <button type="submit" className="btn btn-secondary w-full">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
