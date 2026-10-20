// src/components/Navbar/index.jsx
import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../App'; 

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  // ไม่แสดง Navbar ในหน้า Login
  if (location.pathname === '/login' || !isAuthenticated) return null;

  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  const username = currentUser.username || 'User';
  const avatarUrl = currentUser.avatarUrl;

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="navbar bg-base-100 shadow-sm border-b border-base-200 px-4">
      <div className="navbar-start">
        <Link to="/homepage" className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-xl tracking-tight hidden sm:block">RobotSim 6DOF</span>
        </Link>
      </div>

      <div className="navbar-end gap-3">

        {/* User Profile Dropdown */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle avatar border border-base-300">
            <div className="w-10 rounded-full">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" />
                : <img src={`https://ui-avatars.com/api/?name=${username}&background=0D8ABC&color=fff`} alt="avatar" />
              }
            </div>
          </label>
          <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-200 z-[100]">
            <li className="px-4 py-2 font-bold text-primary border-b border-base-100">@{username}</li>
            <li><button onClick={() => navigate('/settings')}>Settings</button></li>
            <li><button onClick={handleLogout} className="text-error font-semibold">Logout</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
}