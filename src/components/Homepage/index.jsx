import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- Configuration & Kinematics Data ---
const LINKS = {
  L1: 60.5,
  L2: 120.0,
  L3: 89.75,
  L4: 35.07,
  L5: 119.52
};

const JOINT_LABELS = { base: 'J1', shoulder: 'J2', elbow: 'J3', wrist1: 'J4', wrist2: 'J5' };

// --- Helper Functions ---
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;
const fmt3 = (n) => (Number.isFinite(n) ? n.toFixed(3) : '0.000');

// --- Forward Kinematics (Simplfied based on Image Axis) ---
const calculateFK = (joints) => {
  const { base, shoulder, elbow, wrist1, wrist2 } = joints;
  // หมายเหตุ: นี่คือการจำลองตำแหน่งเบื้องต้นตามโครงสร้าง Link ในรูป
  // ในโปรเจคจริงต้องใช้ Denavit-Hartenberg (DH) Matrix เต็มรูปแบบ
  const r1 = toRad(base);
  const r2 = toRad(shoulder);
  const r3 = toRad(elbow);
  
  const x = Math.cos(r1) * (LINKS.L2 * Math.cos(r2) + LINKS.L3 * Math.cos(r2 + r3));
  const y = Math.sin(r1) * (LINKS.L2 * Math.cos(r2) + LINKS.L3 * Math.cos(r2 + r3));
  const z = LINKS.L1 + LINKS.L2 * Math.sin(r2) + LINKS.L3 * Math.sin(r2 + r3);

  return { x, y, z, roll: wrist1, pitch: wrist2, yaw: base };
};

// --- 3D Robot Model Component ---
function RobotScene({ joints, gripperClosed }) {
  const group1 = useRef(); // Base
  const group2 = useRef(); // Shoulder
  const group3 = useRef(); // Elbow
  const group4 = useRef(); // Wrist

  return (
    <group position={[0, -50, 0]}>
      {/* Link 1: Base to Shoulder */}
      <mesh position={[0, LINKS.L1 / 2, 0]}>
        <cylinderGeometry args={[10, 12, LINKS.L1]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* J1: Base Rotation */}
      <group rotation={[0, -toRad(joints.base), 0]}>
        {/* Link 2 */}
        <group position={[0, LINKS.L1, 0]} rotation={[toRad(joints.shoulder), 0, 0]}>
          <mesh position={[0, LINKS.L2 / 2, 0]}>
            <boxGeometry args={[8, LINKS.L2, 8]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          
          {/* Link 3 */}
          <group position={[0, LINKS.L2, 0]} rotation={[toRad(joints.elbow), 0, 0]}>
            <mesh position={[0, LINKS.L3 / 2, 0]}>
              <boxGeometry args={[6, LINKS.L3, 6]} />
              <meshStandardMaterial color="#60a5fa" />
            </mesh>

            {/* Link 4 & 5 (Wrist/Effector) */}
            <group position={[0, LINKS.L3, 0]} rotation={[toRad(joints.wrist1), 0, toRad(joints.wrist2)]}>
              <mesh position={[0, (LINKS.L4 + LINKS.L5)/2, 0]}>
                <cylinderGeometry args={[2, 4, LINKS.L4 + LINKS.L5]} />
                <meshStandardMaterial color={gripperClosed ? "#ef4444" : "#10b981"} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// --- Main Component ---
export default function Homepage() {
  const [settings, setSettings] = useState({
    joints: { base: 0, shoulder: 0, elbow: 0, wrist1: 0, wrist2: 0 },
    cartesian: { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 },
    movementSpeed: 50,
    paths: [],
    currentPathName: '',
    gripperClosed: false,
    delayMs: 1000,
    jogMultiplier: 1,
    emergencyStop: false
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);
  const jogIntervalRef = useRef(null);

  // --- E-Stop Logic ---
  useEffect(() => {
    if (settings.emergencyStop) {
      stopJogging();
      setIsPlaying(false);
    }
  }, [settings.emergencyStop]);

  // --- Update Cartesian when Joints change (FK) ---
  useEffect(() => {
    const newCoords = calculateFK(settings.joints);
    setSettings(prev => ({ ...prev, cartesian: newCoords }));
  }, [settings.joints]);

  const updateSetting = (k, v) => {
    if (settings.emergencyStop && k !== 'emergencyStop') return;
    setSettings(prev => ({ ...prev, [k]: v }));
  };

  // --- Jogging Control ---
  const startJogging = (type, axis, direction) => {
    if (settings.emergencyStop) return;
    const run = () => {
      setSettings(prev => {
        const step = direction * (type === 'joint' ? 1 : 2) * (prev.movementSpeed / 50) * prev.jogMultiplier;
        if (type === 'joint') {
          return { ...prev, joints: { ...prev.joints, [axis]: prev.joints[axis] + step } };
        }
        // Simplified IK placeholder for manual jogging
        return { ...prev, cartesian: { ...prev.cartesian, [axis]: prev.cartesian[axis] + step } };
      });
    };
    run();
    jogIntervalRef.current = setInterval(run, 50);
  };

  const stopJogging = () => clearInterval(jogIntervalRef.current);

  // --- Playback Engine (PLAY ALL) ---
  const playPath = async () => {
    if (settings.emergencyStop || settings.paths.length === 0) return;
    setIsPlaying(true);

    for (const path of settings.paths) {
      for (const point of path.points) {
        if (settings.emergencyStop) break;

        if (point.type === 'delay') {
          await new Promise(r => setTimeout(r, point.value));
        } else if (point.type === 'gripper') {
          updateSetting('gripperClosed', point.value);
        } else {
          // Linear interpolation approximation based on speed
          const duration = 2000 / (settings.movementSpeed / 50); 
          setSettings(prev => ({ ...prev, joints: point.joints }));
          await new Promise(r => setTimeout(r, duration));
        }
      }
      if (settings.emergencyStop) break;
    }
    setIsPlaying(false);
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row gap-3 p-3 bg-[#0f1115] text-slate-200 overflow-hidden font-sans">
      
      {/* E-STOP MODAL */}
      {settings.emergencyStop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-red-900/20 backdrop-blur-md">
          <div className="bg-[#1a1c23] border-2 border-red-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center max-w-sm animate-bounce">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl font-black">!</span>
            </div>
            <h1 className="text-2xl font-black text-red-500 mb-2">EMERGENCY STOP</h1>
            <p className="text-slate-400 text-sm mb-6">All systems halted. Please clear obstacles before resetting.</p>
            <button 
              onClick={() => updateSetting('emergencyStop', false)}
              className="btn btn-error w-full font-bold"
            >
              RESET SYSTEM
            </button>
          </div>
        </div>
      )}

      {/* 1. Operation Panel */}
      <div className="w-full lg:w-[25%] flex flex-col gap-3 overflow-y-auto custom-scrollbar">
        <div className="bg-[#1a1c23] p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Control Center</h2>
            <button 
              onClick={() => updateSetting('emergencyStop', true)}
              className="btn btn-sm btn-error animate-pulse font-black"
            >
              E-STOP
            </button>
          </div>

          {/* Speed Control */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] mb-1 font-bold">
              <span className="opacity-50">VELOCITY</span>
              <span className="text-primary">{settings.movementSpeed}%</span>
            </div>
            <input 
              type="range" min="1" max="100" 
              className="range range-xs range-primary" 
              value={settings.movementSpeed} 
              onChange={(e) => updateSetting('movementSpeed', Number(e.target.value))} 
            />
          </div>

          {/* Jogging Controls */}
          <div className="space-y-4">
             {/* Joints */}
             <div>
               <p className="text-[10px] font-bold opacity-30 mb-2">JOINT SPACE (DEG)</p>
               {Object.keys(settings.joints).map(j => (
                 <div key={j} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] w-6 font-mono text-slate-500">{JOINT_LABELS[j]}</span>
                    <button onMouseDown={() => startJogging('joint', j, -1)} onMouseUp={stopJogging} className="btn btn-xs btn-outline w-8">-</button>
                    <button onMouseDown={() => startJogging('joint', j, 1)} onMouseUp={stopJogging} className="btn btn-xs btn-outline w-8">+</button>
                    <div className="flex-1 text-right font-mono text-xs text-info bg-black/30 rounded px-2 py-1">
                      {settings.joints[j].toFixed(1)}°
                    </div>
                 </div>
               ))}
             </div>

             {/* Actions */}
             <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] opacity-40">GRIPPER</span>
                  <button 
                    onClick={() => updateSetting('gripperClosed', !settings.gripperClosed)}
                    className={`btn btn-xs ${settings.gripperClosed ? 'btn-error' : 'btn-success'}`}
                  >
                    {settings.gripperClosed ? 'CLOSE' : 'OPEN'}
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] opacity-40">DELAY (MS)</span>
                  <input 
                    type="number" 
                    className="input input-xs input-bordered h-6 text-[10px]" 
                    value={settings.delayMs}
                    onChange={e => updateSetting('delayMs', Number(e.target.value))}
                  />
                </div>
             </div>
          </div>
        </div>

        {/* Path Manager */}
        <div className="bg-[#1a1c23] p-4 rounded-xl border border-slate-800">
           <button 
            onClick={() => setShowPathModal(true)}
            className="btn btn-xs btn-primary w-full mb-3"
           >+ CREATE NEW PATH</button>

           {settings.currentPathName && (
             <div className="flex flex-col gap-2">
                <div className="badge badge-outline text-[10px] w-full py-3">{settings.currentPathName}</div>
                <div className="grid grid-cols-3 gap-1">
                  <button 
                    onClick={() => {
                      const newPaths = [...settings.paths];
                      const idx = newPaths.findIndex(p => p.name === settings.currentPathName);
                      newPaths[idx].points.push({ type: 'move', joints: {...settings.joints} });
                      setSettings(prev => ({ ...prev, paths: newPaths }));
                    }}
                    className="btn btn-xs btn-success text-[9px]"
                  >ADD POS</button>
                  <button 
                    onClick={() => {
                      const newPaths = [...settings.paths];
                      const idx = newPaths.findIndex(p => p.name === settings.currentPathName);
                      newPaths[idx].points.push({ type: 'gripper', value: settings.gripperClosed });
                      setSettings(prev => ({ ...prev, paths: newPaths }));
                    }}
                    className="btn btn-xs btn-warning text-[9px]"
                  >ADD GRIP</button>
                  <button 
                    onClick={() => {
                      const newPaths = [...settings.paths];
                      const idx = newPaths.findIndex(p => p.name === settings.currentPathName);
                      newPaths[idx].points.push({ type: 'delay', value: settings.delayMs });
                      setSettings(prev => ({ ...prev, paths: newPaths }));
                    }}
                    className="btn btn-xs btn-info text-[9px]"
                  >ADD DELAY</button>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* 2. Path Planning & Visualization */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex-1 bg-[#1a1c23] rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-black/20">
            <h3 className="text-xs font-bold uppercase tracking-tighter">Sequence Editor</h3>
            <button 
              onClick={playPath}
              disabled={isPlaying || settings.emergencyStop}
              className={`btn btn-xs px-6 ${isPlaying ? 'btn-ghost loading' : 'btn-success text-white font-black'}`}
            >
              {isPlaying ? 'RUNNING' : 'PLAY ALL'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <table className="table table-xs w-full">
              <thead>
                <tr className="text-slate-500">
                  <th>Step</th>
                  <th>Path Name</th>
                  <th>Actions</th>
                  <th className="text-right">Cmds</th>
                </tr>
              </thead>
              <tbody>
                {settings.paths.map((path, i) => (
                  <tr key={i} className="hover:bg-white/5 cursor-pointer" onClick={() => updateSetting('currentPathName', path.name)}>
                    <td className="text-primary font-bold">#{i+1}</td>
                    <td>{path.name}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {path.points.map((p, pi) => (
                          <div key={pi} className={`w-2 h-2 rounded-full ${p.type === 'move' ? 'bg-info' : p.type === 'gripper' ? 'bg-warning' : 'bg-slate-500'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="text-right">
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => {
                        setSettings(prev => ({ ...prev, paths: prev.paths.filter((_, idx) => idx !== i) }))
                      }}>DEL</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. 3D Simulation (Three.js) */}
      <div className="w-full lg:w-[40%] bg-black rounded-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
          <div className="badge badge-ghost text-[10px] border-slate-700">3D REAL-TIME VIEW</div>
          <div className="text-[10px] font-mono text-success">X: {fmt3(settings.cartesian.x)}</div>
          <div className="text-[10px] font-mono text-success">Y: {fmt3(settings.cartesian.y)}</div>
          <div className="text-[10px] font-mono text-success">Z: {fmt3(settings.cartesian.z)}</div>
        </div>

        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[200, 200, 400]} fov={50} />
          <OrbitControls makeDefault />
          <ambientLight intensity={0.5} />
          <pointLight position={[100, 500, 100]} intensity={1} />
          <gridHelper args={[500, 10, '#334155', '#1e293b']} />
          <axesHelper args={[100]} />
          
          <RobotScene joints={settings.joints} gripperClosed={settings.gripperClosed} />
        </Canvas>

        <div className="absolute bottom-4 right-4 text-[9px] opacity-30 text-right">
          DH PARAMETERS ACTIVE<br/>
          LINKS: L1:{LINKS.L1} L2:{LINKS.L2} L3:{LINKS.L3}
        </div>
      </div>

      {/* Modal New Path */}
      {showPathModal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] backdrop-blur-sm">
          <div className="bg-[#1a1c23] p-6 rounded-2xl border border-slate-700 w-72 shadow-2xl">
            <h3 className="font-bold text-primary mb-4 text-center text-xs uppercase tracking-widest">New Sequence</h3>
            <input 
              type="text" autoFocus className="input input-bordered w-full bg-black/40 text-sm mb-4" 
              placeholder="Path Name (e.g. Pick Part)" 
              value={settings.currentPathName} 
              onChange={e => updateSetting('currentPathName', e.target.value)} 
            />
            <div className="flex gap-2">
              <button className="btn btn-sm flex-1 btn-ghost" onClick={() => setShowPathModal(false)}>CANCEL</button>
              <button className="btn btn-sm flex-1 btn-primary" onClick={() => {
                if(settings.currentPathName) {
                  setSettings(prev => ({ ...prev, paths: [...prev.paths, { name: prev.currentPathName, points: [] }] }));
                  setShowPathModal(false);
                }
              }}>CREATE</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}