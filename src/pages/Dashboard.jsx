import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import LeafletMap from '../components/LeafletMap';
import { 
  Compass, 
  MapPin, 
  Bus as BusIcon, 
  Users, 
  Activity, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Circle,
  Phone,
  Gauge,
  Focus,
  Maximize2
} from 'lucide-react';

const Dashboard = () => {
  const { realtimeBuses, systemLogs } = useSocket();
  const [cities, setCities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  
  // Custom user-friendly controls
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [mapFocusTrigger, setMapFocusTrigger] = useState(null);

  // Stats
  const [activeBusesCount, setActiveBusesCount] = useState(0);

  // Fetch cities on load
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data } = await api.get('/cities');
        setCities(data);
        if (data.length > 0) {
          setSelectedCity(data[0]); // Auto-select first city
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, []);

  // Fetch routes when selectedCity changes
  useEffect(() => {
    if (!selectedCity) return;

    const fetchRoutes = async () => {
      try {
        const { data } = await api.get(`/routes?city=${selectedCity._id}`);
        setRoutes(data);
        setSelectedRoute(null);
        setSelectedBus(null);
      } catch (err) {
        console.error('Error fetching routes:', err);
      }
    };
    fetchRoutes();
  }, [selectedCity]);

  // Update active buses count based on socket telemetry
  useEffect(() => {
    setActiveBusesCount(realtimeBuses.filter((b) => b.status === 'Active').length);
  }, [realtimeBuses]);

  // Sync selectedBus data with real-time socket updates
  const getLiveSelectedBus = () => {
    if (!selectedBus) return null;
    const live = realtimeBuses.find((b) => b.busId === selectedBus._id || b.busId === selectedBus.busId);
    return live ? { ...selectedBus, ...live } : selectedBus;
  };

  const liveSelectedBus = getLiveSelectedBus();

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    const cityObj = cities.find((c) => c._id === cityId);
    setSelectedCity(cityObj);
  };

  const handleRouteChange = (e) => {
    const routeId = e.target.value;
    if (!routeId) {
      setSelectedRoute(null);
      setSelectedBus(null);
      return;
    }
    const routeObj = routes.find((r) => r._id === routeId);
    setSelectedRoute(routeObj);
    setSelectedBus(null); // Clear selected bus when route changes
  };

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    
    // Find the associated route from routes state
    const matchedRoute = routes.find((r) => r._id === bus.routeId || r._id === (bus.route && bus.route._id));
    if (matchedRoute) {
      setSelectedRoute(matchedRoute);
    }
  };

  const formatEta = (seconds) => {
    if (seconds === -1) return 'Passed';
    if (seconds === 0) return 'Arrived';
    const mins = Math.floor(seconds / 60);
    if (mins === 0) return 'Arriving';
    return `${mins}m ${seconds % 60}s`;
  };

  // Calculate route completion progress for the selected bus
  const getRouteProgress = () => {
    if (!selectedRoute || !selectedRoute.stops || !liveSelectedBus || !liveSelectedBus.nextStopsETA) {
      return { percentage: 0, passed: 0, total: 0 };
    }
    const total = selectedRoute.stops.length;
    let passed = 0;
    selectedRoute.stops.forEach((stop) => {
      const liveEta = liveSelectedBus.nextStopsETA.find(s => s.stopName === stop.name);
      if (liveEta && liveEta.etaSeconds === -1) {
        passed++;
      }
    });
    return {
      percentage: Math.round((passed / total) * 100),
      passed,
      total
    };
  };

  const progress = getRouteProgress();

  return (
    <div className="dashboard-container" style={{
      display: 'flex',
      gap: '20px',
      height: 'calc(100vh - 120px)',
      marginRight: '20px',
      marginBottom: '16px',
      flex: 1,
      position: 'relative'
    }}>
      {/* 1. LEFT CONTROLLER SIDEBAR PANEL */}
      <div className="dashboard-sidebar" style={{
        width: panelCollapsed ? '0px' : '320px',
        opacity: panelCollapsed ? 0 : 1,
        visibility: panelCollapsed ? 'hidden' : 'visible',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexShrink: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}>
        {/* Filter Panel */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="var(--color-primary)" />
              <span>Map Controller</span>
            </h2>
            <button 
              onClick={() => setPanelCollapsed(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              title="Collapse Panel"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* City Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>OPERATIONS CITY</label>
              <select 
                value={selectedCity?._id || ''} 
                onChange={handleCityChange}
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                {Array.isArray(cities) && cities.map((city) => (
                  <option key={city._id} value={city._id}>{city.name} ({city.country})</option>
                ))}
              </select>
            </div>

            {/* Route Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>FILTER ROUTE</label>
              <select 
                value={selectedRoute?._id || ''} 
                onChange={handleRouteChange}
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                <option value="">All Routes</option>
                {Array.isArray(routes) && routes.map((route) => (
                  <option key={route._id} value={route._id}>{route.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selected Bus Telemetry Drawer */}
        <div className="glass-panel" style={{ 
          flex: 1, 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          overflowY: 'auto'
        }}>
          {liveSelectedBus ? (
            <div className="slide-in-right" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {/* Bus Title header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Bus {liveSelectedBus.busNumber}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{liveSelectedBus.model || 'Electric Bus'}</span>
                </div>
                <button 
                  onClick={() => setSelectedBus(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-dim)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-dim)'}
                >
                  Clear Selection
                </button>
              </div>

              {/* Action Buttons for easy tracking */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setMapFocusTrigger({ timestamp: Date.now(), type: 'bus' })}
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '6px',
                    color: 'var(--color-primary)',
                    fontSize: '0.75rem',
                    padding: '6px 10px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    flex: 1,
                    justifyContent: 'center'
                  }}
                  title="Center map on this bus"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.18)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'}
                >
                  <Focus size={12} />
                  Focus Bus
                </button>
                
                {selectedRoute && (
                  <button 
                    onClick={() => setMapFocusTrigger({ timestamp: Date.now(), type: 'route' })}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.75rem',
                      padding: '6px 10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      flex: 1,
                      justifyContent: 'center'
                    }}
                    title="Fit route coordinates in map view"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                  >
                    <Maximize2 size={12} />
                    Fit Route
                  </button>
                )}
              </div>

              {/* Status Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Gauge size={14} color="var(--color-primary)" />
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>SPEED</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{liveSelectedBus.speed || 0} km/h</div>
                  </div>
                </div>

                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 
                    liveSelectedBus.crowdLevel === 'High' ? 'rgba(239, 68, 68, 0.04)' :
                    liveSelectedBus.crowdLevel === 'Medium' ? 'rgba(245, 158, 11, 0.04)' : 'rgba(16, 185, 129, 0.04)',
                  borderColor:
                    liveSelectedBus.crowdLevel === 'High' ? 'rgba(239, 68, 68, 0.15)' :
                    liveSelectedBus.crowdLevel === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                }}>
                  <Users size={14} color={
                    liveSelectedBus.crowdLevel === 'High' ? 'var(--color-danger)' :
                    liveSelectedBus.crowdLevel === 'Medium' ? 'var(--color-warning)' : 'var(--color-success)'
                  } />
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>CROWD</div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 700, 
                      color: 
                        liveSelectedBus.crowdLevel === 'High' ? 'var(--color-danger)' :
                        liveSelectedBus.crowdLevel === 'Medium' ? 'var(--color-warning)' : 'var(--color-success)'
                    }}>{liveSelectedBus.crowdLevel}</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar (User Friendly Integration) */}
              {selectedRoute && (
                <div style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    <span>Route progress</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{progress.percentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${progress.percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                      borderRadius: '3px',
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', textAlign: 'right' }}>
                    {progress.passed} of {progress.total} stops completed
                  </div>
                </div>
              )}

              {/* Driver Details */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>ASSIGNED DRIVER</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{liveSelectedBus.driverName || (liveSelectedBus.driver && liveSelectedBus.driver.name) || 'N/A'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <Phone size={12} color="var(--color-primary)" />
                  <span>{liveSelectedBus.driverPhone || (liveSelectedBus.driver && liveSelectedBus.driver.phone) || 'N/A'}</span>
                </div>
              </div>

              {/* Stops & ETAs Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>ROUTE PROGRESS & ETA</div>
                
                {selectedRoute && Array.isArray(selectedRoute.stops) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative', paddingLeft: '8px' }}>
                    {/* Path line background */}
                    <div style={{
                      position: 'absolute',
                      left: '16px',
                      top: '12px',
                      bottom: '12px',
                      width: '2px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      zIndex: 1
                    }}></div>

                    {selectedRoute.stops.map((stop) => {
                      // Get live stop ETA
                      const liveEta = liveSelectedBus.nextStopsETA?.find((s) => s.stopName === stop.name);
                      const isPassed = liveEta ? liveEta.etaSeconds === -1 : false;
                      const isArrived = liveEta ? liveEta.etaSeconds === 0 : false;
                      
                      return (
                        <div key={stop._id} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '8px 0',
                          position: 'relative',
                          zIndex: 2
                        }}>
                          {/* Checkpoint icon */}
                          <div style={{
                            backgroundColor: 'var(--bg-sidebar)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2px'
                          }}>
                            {isPassed ? (
                              <CheckCircle2 size={16} color="var(--color-success)" fill="rgba(16, 185, 129, 0.1)" />
                            ) : isArrived ? (
                              <div className="status-dot active" style={{ width: '12px', height: '12px', margin: '2px' }}></div>
                            ) : (
                              <Circle size={16} color="var(--color-text-dim)" />
                            )}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color: isPassed ? 'var(--color-text-dim)' : '#fff'
                            }}>
                              {stop.name}
                            </div>
                            
                            <div style={{
                              fontSize: '0.75rem',
                              color: isPassed ? 'var(--color-text-dim)' : isArrived ? 'var(--color-success)' : 'var(--color-accent)',
                              fontWeight: 500,
                              marginTop: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock size={10} />
                              <span>{liveEta ? formatEta(liveEta.etaSeconds) : 'Calculating...'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', fontStyle: 'italic' }}>
                    No route path populated
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-dim)',
              textAlign: 'center',
              gap: '12px'
            }}>
              <BusIcon size={32} color="var(--color-primary)" />
              <div style={{ fontSize: '0.85rem' }}>
                Select a bus marker on the map or select a route filter above to view live stops and details
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT PANEL: MAP & LOGS CONSOLE */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative' // needed for absolute overlay buttons
      }}>
        {/* Floating toggle button when left panel is collapsed */}
        {panelCollapsed && (
          <button 
            onClick={() => setPanelCollapsed(false)}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 1000,
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              borderRadius: '10px',
              color: '#fff',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
            title="Expand Map Controller"
          >
            <Compass size={16} />
            Show Controller
            <ChevronRight size={16} />
          </button>
        )}

        {/* Top Mini-Stats bar */}
        <div className="stats-bar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--color-success)',
              padding: '10px',
              borderRadius: '8px',
            }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Active Busses</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{activeBusesCount} buses</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--color-primary)',
              padding: '10px',
              borderRadius: '8px',
            }}>
              <MapPin size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Operational Route Stops</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                {selectedRoute ? `${selectedRoute.stops?.length || 0} stops` : `${routes.reduce((acc, curr) => acc + (curr.stops?.length || 0), 0)} stops`}
              </div>
            </div>
          </div>

          {/* <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: 'var(--color-warning)',
              padding: '10px',
              borderRadius: '8px',
            }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Server Health</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>Operational (99.9%)</div>
            </div>
          </div> */}
        </div>

        {/* Leaflet Map Area */}
        <div className="dashboard-map-wrapper" style={{ flex: 1, zIndex: 1 }}>
          <LeafletMap 
            selectedCity={selectedCity} 
            selectedRoute={selectedRoute} 
            selectedBus={liveSelectedBus}
            onBusSelect={handleBusSelect}
            mapFocusTrigger={mapFocusTrigger}
          />
        </div>

        {/* Real-time Ticker Terminal Logs */}
        <div className="glass-panel" style={{
          height: '110px',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="status-dot active" style={{ width: '6px', height: '6px' }}></span>
              SYSTEM CONSOLE
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>showing last events</span>
          </div>
          
          {/* Logs list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            color: '#a3a3a3'
          }}>
            {systemLogs.length === 0 ? (
              <div style={{ color: 'var(--color-text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
                Waiting for WebSocket telemetry broadcast events...
              </div>
            ) : (
              systemLogs.map((log, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: 'var(--color-text-dim)' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span style={{ color: 'var(--color-success)' }}>[INFO]</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
