// src/components/DashboardContent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users,
  Building2,
  UsersRound,
  IndianRupee,
  Menu
} from 'lucide-react';
import Sidebar from './Sidebar';

export default function DashboardContent() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [membershipData, setMembershipData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [statsRes, weeklyRes, membershipRes] = await Promise.all([
        fetch('http://localhost:3001/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3001/api/dashboard/attendance-weekly', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3001/api/dashboard/membership-growth', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const weekly = await weeklyRes.json();
      const membership = await membershipRes.json();

      console.log('Stats from backend:', statsData);
      console.log('Weekly from backend:', weekly);
      console.log('Membership from backend:', membership);

      // Convert stats object to array if needed
      let finalStats = [];
      if (Array.isArray(statsData)) {
        finalStats = statsData;
      } else if (statsData && typeof statsData === 'object') {
        finalStats = [
          { 
            label: 'Total Members', 
            value: statsData.totalMembers || statsData.members || 0, 
            growth: statsData.memberGrowth || '+0%',
            icon: 'users',
            color: '#3b82f6'
          },
          { 
            label: 'Active Branches', 
            value: statsData.activeBranches || statsData.branches || 0, 
            growth: statsData.branchGrowth || '+0',
            icon: 'building',
            color: '#10b981'
          },
          { 
            label: 'Total Employees', 
            value: statsData.totalEmployees || statsData.employees || 0, 
            growth: statsData.employeeGrowth || '+0%',
            icon: 'team',
            color: '#f59e0b'
          },
          { 
            label: 'Revenue This Month', 
            value: `₹${statsData.monthlyRevenue || statsData.revenue || 0}`, 
            growth: statsData.revenueGrowth || '+0%',
            icon: 'rupee',
            color: '#17ab88'
          }
        ];
      }

      setStats(finalStats);
      setWeeklyData(Array.isArray(weekly) ? weekly : []);
      setMembershipData(Array.isArray(membership) ? membership : []);

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleMenuChange = (menu) => {
    setActiveMenu(menu);
    
    // ✅ UPDATED: Added Follow Ups route
    const routes = {
      'Dashboard': '/dashboard',
      'Enquiry': '/enquiry',
      'Follow Ups': '/followups', // ✅ NEW
      'Members': '/members',
      'Attendance': '/attendance',
      'Masters': '/masters',
    };
    
    if (routes[menu]) {
      navigate(routes[menu]);
    }
    
    closeSidebar();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getIcon = (iconName) => {
    const iconMap = {
      users: Users,
      building: Building2,
      team: UsersRound,
      rupee: IndianRupee,
    };
    return iconMap[iconName] || Users;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeMenu={activeMenu} 
        onChange={handleMenuChange}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="dashboard-main">
        <div className="dashboard-mobile-header">
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <h1 className="dashboard-mobile-title">Muscle Time ERP</h1>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1 className="dashboard-page-title">Dashboard</h1>
            <p className="dashboard-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="stats-grid">
            {stats && stats.length > 0 ? (
              stats.map((stat, index) => {
                const Icon = getIcon(stat.icon);
                
                return (
                  <div key={index} className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
                      <Icon size={28} color={stat.color} strokeWidth={2} />
                    </div>
                    <div className="stat-content">
                      <div className="stat-header">
                        <h2 className="stat-value">{stat.value}</h2>
                        {stat.growth && (
                          <span className="stat-growth" style={{ color: stat.color }}>
                            {stat.growth}
                          </span>
                        )}
                      </div>
                      <p className="stat-label">{stat.label}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>No stats available</p>
            )}
          </div>

          <div className="charts-grid-full">
            {/* Weekly Attendance Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Weekly Attendance</h3>
              <div className="chart-placeholder">
                {weeklyData && weeklyData.length > 0 ? (
                  <>
                    <div className="chart-with-scale">
                      {/* Dynamic Y-Axis */}
                      <div className="y-axis">
                        {(() => {
                          const maxValue = Math.max(...weeklyData.map(d => (d.present || 0) + (d.absent || 0)));
                          const roundedMax = maxValue < 10 ? 10 : Math.ceil(maxValue / 10) * 10;
                          const steps = [];
                          for (let i = 0; i <= 5; i++) {
                            steps.push(Math.round((roundedMax / 5) * (5 - i)));
                          }
                          return steps.map(step => (
                            <div key={step} className="y-axis-label">{step}</div>
                          ));
                        })()}
                      </div>

                      {/* Bar Chart */}
                      <div className="bar-chart-container">
                        <div className="bar-chart">
                          {weeklyData.map((data, idx) => {
                            const maxValue = Math.max(...weeklyData.map(d => (d.present || 0) + (d.absent || 0)));
                            const roundedMax = maxValue < 10 ? 10 : Math.ceil(maxValue / 10) * 10;
                            const totalHeight = 100;
                            const presentHeight = ((data.present || 0) / roundedMax) * totalHeight;
                            const absentHeight = ((data.absent || 0) / roundedMax) * totalHeight;

                            return (
                              <div key={idx} className="bar-group">
                                <div className="bar-stack">
                                  <div 
                                    className="bar bar-present" 
                                    style={{ height: `${presentHeight}%` }}
                                  />
                                  <div 
                                    className="bar bar-absent" 
                                    style={{ height: `${absentHeight}%` }}
                                  />
                                </div>
                                <span className="bar-label">{data.day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-dot" style={{ backgroundColor: '#3b82f6' }}></div>
                        <span>Present</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot" style={{ backgroundColor: '#ef4444' }}></div>
                        <span>Absent</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No attendance data</p>
                )}
              </div>
            </div>

            {/* Membership Growth Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Membership Growth</h3>
              <div className="chart-placeholder">
                {membershipData && membershipData.length > 0 ? (
                  <>
                    <div className="line-chart">
                      <svg viewBox="0 0 600 280" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <line
                            key={i}
                            x1="20"
                            y1={30 + i * 40}
                            x2="580"
                            y2={30 + i * 40}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                        ))}
                        
                        {/* Line and circles */}
                        {(() => {
                          const maxMembers = Math.max(...membershipData.map(m => m.total || 0), 1);
                          const points = membershipData
                            .map((d, i) => {
                              const x = membershipData.length > 1 
                                ? (i / (membershipData.length - 1)) * 560 + 20
                                : 300;
                              const y = 30 + (1 - (d.total || 0) / maxMembers) * 200;
                              return { x, y, value: d.total || 0 };
                            });

                          return (
                            <>
                              {/* Line */}
                              {points.length > 1 && (
                                <polyline
                                  fill="none"
                                  stroke="#17ab88"
                                  strokeWidth="3"
                                  points={points.map(p => `${p.x},${p.y}`).join(' ')}
                                />
                              )}
                              
                              {/* Circles and values */}
                              {points.map((point, i) => (
                                <g key={i}>
                                  <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="6"
                                    fill="#17ab88"
                                    stroke="white"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x={point.x}
                                    y={point.y - 12}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#17ab88"
                                    fontWeight="600"
                                  >
                                    {point.value}
                                  </text>
                                </g>
                              ))}
                              
                              {/* Month labels */}
                              {membershipData.map((d, i) => {
                                const x = membershipData.length > 1 
                                  ? (i / (membershipData.length - 1)) * 560 + 20
                                  : 300;
                                return (
                                  <text
                                    key={i}
                                    x={x}
                                    y={250}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#6b7280"
                                    fontWeight="500"
                                  >
                                    {d.month}
                                  </text>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-dot" style={{ backgroundColor: '#17ab88' }}></div>
                        <span>Total Members</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No membership data</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
