import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Building2, 
  MapPin, 
  Bus as BusIcon, 
  UserPlus, 
  Plus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  AlertTriangle,
  Lock
} from 'lucide-react';

const AdminPanel = () => {
  const { isSuperAdmin } = useAuth();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('buses');
  
  // Global registries
  const [cities, setCities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  
  // Form loading states
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // 1. City Form State
  const [cityName, setCityName] = useState('');
  const [cityCountry, setCityCountry] = useState('');
  const [cityLat, setCityLat] = useState('');
  const [cityLng, setCityLng] = useState('');

  // 2. Route Form State
  const [routeName, setRouteName] = useState('');
  const [routeCity, setRouteCity] = useState('');
  const [routeStart, setRouteStart] = useState('');
  const [routeEnd, setRouteEnd] = useState('');
  const [routeStops, setRouteStops] = useState([{ name: '', lat: '', lng: '' }]);

  // 3. Driver Form State
  const [driverName, setDriverName] = useState('');
  const [driverLic, setDriverLic] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverStatus, setDriverStatus] = useState('Available');

  // 4. Bus Form State
  const [busNumber, setBusNumber] = useState('');
  const [busModel, setBusModel] = useState('');
  const [busCapacity, setBusCapacity] = useState('50');
  const [busStatus, setBusStatus] = useState('Inactive');
  const [busRoute, setBusRoute] = useState('');
  const [busDriver, setBusDriver] = useState('');
  const [busCrowd, setBusCrowd] = useState('Low');

  // Fetch all directories
  const fetchAllData = async () => {
    try {
      const [citiesRes, routesRes, driversRes, busesRes] = await Promise.all([
        api.get('/cities'),
        api.get('/routes'),
        api.get('/drivers'),
        api.get('/buses'),
      ]);
      setCities(citiesRes.data);
      setRoutes(routesRes.data);
      setDrivers(driversRes.data);
      setBuses(busesRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  };

  // --- SUBMISSIONS ---

  // City Submit (Super Admin Only)
  const handleCitySubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showMsg('Unauthorized: City creation requires SuperAdmin role.', 'danger');
      return;
    }
    setLoading(true);
    try {
      await api.post('/cities', {
        name: cityName,
        country: cityCountry,
        centerCoordinates: { lat: Number(cityLat), lng: Number(cityLng) }
      });
      showMsg(`City ${cityName} created successfully.`);
      setCityName('');
      setCityCountry('');
      setCityLat('');
      setCityLng('');
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error creating city', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Driver Submit
  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/drivers', {
        name: driverName,
        licenseNumber: driverLic,
        phone: driverPhone,
        status: driverStatus
      });
      showMsg(`Driver ${driverName} enrolled successfully.`);
      setDriverName('');
      setDriverLic('');
      setDriverPhone('');
      setDriverStatus('Available');
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error enrolling driver', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Route Submit
  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    if (!routeCity) {
      showMsg('Please select a City for this route.', 'danger');
      return;
    }
    // Validate stops
    for (const stop of routeStops) {
      if (!stop.name || !stop.lat || !stop.lng) {
        showMsg('Please fill in all stop names and coordinates.', 'danger');
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/routes', {
        name: routeName,
        city: routeCity,
        startLocation: routeStart,
        endLocation: routeEnd,
        stops: routeStops
      });
      showMsg(`Route ${routeName} created successfully.`);
      setRouteName('');
      setRouteStart('');
      setRouteEnd('');
      setRouteCity('');
      setRouteStops([{ name: '', lat: '', lng: '' }]);
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error creating route', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Bus Submit
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/buses', {
        busNumber,
        model: busModel,
        capacity: Number(busCapacity),
        status: busStatus,
        route: busRoute || null,
        driver: busDriver || null,
        crowdLevel: busCrowd
      });
      showMsg(`Bus ${busNumber} registered successfully.`);
      setBusNumber('');
      setBusModel('');
      setBusCapacity('50');
      setBusStatus('Inactive');
      setBusRoute('');
      setBusDriver('');
      setBusCrowd('Low');
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error registering bus', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Stop Fields Helpers
  const addStopField = () => {
    setRouteStops([...routeStops, { name: '', lat: '', lng: '' }]);
  };

  const removeStopField = (idx) => {
    const values = [...routeStops];
    values.splice(idx, 1);
    setRouteStops(values);
  };

  const handleStopFieldChange = (idx, field, val) => {
    const values = [...routeStops];
    values[idx][field] = val;
    setRouteStops(values);
  };

  // --- DELETE ACTIONS ---
  const deleteEntity = async (url, id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`${url}/${id}`);
      showMsg(`Deleted successfully.`);
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error deleting entity', 'danger');
    }
  };

  return (
    <div style={{ padding: '0 20px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title Header */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="var(--color-primary)" />
            Control Operations Center
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {isSuperAdmin ? 'Super-Operator Mode. Full edit permissions granted.' : 'Operator Mode. Limited to Buses, Drivers & Routes.'}
          </p>
        </div>
      </div>

      {/* Global alert messages */}
      {msg.text && (
        <div style={{
          backgroundColor: msg.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: '1px solid',
          borderColor: msg.type === 'danger' ? 'var(--color-danger)' : 'var(--color-success)',
          color: msg.type === 'danger' ? '#ff6b6b' : '#34d399',
          padding: '14px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          textAlign: 'center',
          fontWeight: 500
        }}>
          {msg.text}
        </div>
      )}

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('buses')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderColor: activeTab === 'buses' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'buses' ? '#fff' : 'var(--color-text-muted)',
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Manage Fleet (Buses)
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderColor: activeTab === 'routes' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'routes' ? '#fff' : 'var(--color-text-muted)',
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Transit Routes
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderColor: activeTab === 'drivers' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'drivers' ? '#fff' : 'var(--color-text-muted)',
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Drivers Registry
        </button>

        <button
          onClick={() => {
            if (isSuperAdmin) setActiveTab('cities');
          }}
          disabled={!isSuperAdmin}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid',
            borderColor: activeTab === 'cities' ? 'var(--color-primary)' : 'transparent',
            color: !isSuperAdmin ? 'var(--color-text-dim)' : activeTab === 'cities' ? '#fff' : 'var(--color-text-muted)',
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: !isSuperAdmin ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {!isSuperAdmin && <Lock size={12} />}
          Cities & Nodes
        </button>
      </div>

      {/* Tabs Content */}
      <div className="admin-panel-content" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* 1. BUSES TAB */}
        {activeTab === 'buses' && (
          <>
            {/* Create form */}
            <div className="glass-panel admin-panel-form" style={{ width: '360px', padding: '24px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--color-primary)" />
                Register New Bus
              </h3>
              <form onSubmit={handleBusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Bus Plate Number / ID</label>
                  <input type="text" placeholder="e.g. MH-01-AX-9999" value={busNumber} onChange={(e) => setBusNumber(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Manufacturer Model</label>
                  <input type="text" placeholder="e.g. BYD K9 Electric" value={busModel} onChange={(e) => setBusModel(e.target.value)} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Max Capacity (Seats)</label>
                  <input type="number" placeholder="50" value={busCapacity} onChange={(e) => setBusCapacity(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Assigned Route</label>
                  <select value={busRoute} onChange={(e) => setBusRoute(e.target.value)}>
                    <option value="">Standby (No Route)</option>
                    {routes.map(r => (
                      <option key={r._id} value={r._id}>{r.name} ({r.city?.name})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Assigned Driver</label>
                  <select value={busDriver} onChange={(e) => setBusDriver(e.target.value)}>
                    <option value="">Standby (No Driver)</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.status})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Initial Status</label>
                    <select value={busStatus} onChange={(e) => setBusStatus(e.target.value)}>
                      {/* <option value="Inactive">Inactive</option> */}
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Crowd Level</label>
                    <select value={busCrowd} onChange={(e) => setBusCrowd(e.target.value)}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#090a0f',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  marginTop: '6px'
                }}>
                  {loading ? 'Registering...' : 'Register Bus'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="glass-panel" style={{ flex: 1, padding: '24px', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px' }}>Bus Registry</h3>
              {buses.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No buses registered.</div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Plate ID</th>
                      <th>Model</th>
                      <th>Route</th>
                      <th>Driver</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buses.map(bus => (
                      <tr key={bus._id}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{bus.busNumber}</td>
                        <td>{bus.model || 'Standard'} ({bus.capacity} seats)</td>
                        <td>{bus.route ? bus.route.name : <span style={{ color: 'var(--color-text-dim)' }}>None</span>}</td>
                        <td>{bus.driver ? bus.driver.name : <span style={{ color: 'var(--color-text-dim)' }}>None</span>}</td>
                        <td>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: bus.status === 'Active' ? 'var(--color-success)' : bus.status === 'Maintenance' ? 'var(--color-warning)' : 'var(--color-text-muted)'
                          }}>
                            <span className={`status-dot ${bus.status.toLowerCase()}`}></span>
                            {bus.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => deleteEntity('/buses', bus._id, bus.busNumber)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-text-dim)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-dim)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* 2. ROUTES TAB */}
        {activeTab === 'routes' && (
          <>
            {/* Create form */}
            <div className="glass-panel admin-panel-form" style={{ width: '420px', padding: '24px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--color-primary)" />
                Create New Transit Route
              </h3>
              <form onSubmit={handleRouteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Route Identifier</label>
                    <input type="text" placeholder="e.g. Route 88" value={routeName} onChange={(e) => setRouteName(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Select City Node</label>
                    <select value={routeCity} onChange={(e) => setRouteCity(e.target.value)} required>
                      <option value="">Select City</option>
                      {cities.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Start Terminal</label>
                    <input type="text" placeholder="Start Point" value={routeStart} onChange={(e) => setRouteStart(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>End Terminal</label>
                    <input type="text" placeholder="End Point" value={routeEnd} onChange={(e) => setRouteEnd(e.target.value)} required />
                  </div>
                </div>

                {/* Dynamic Stop Coordinates list */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Route Stops (In Order)</label>
                    <button
                      type="button"
                      onClick={addStopField}
                      style={{
                        backgroundColor: 'rgba(0, 210, 255, 0.1)',
                        color: 'var(--color-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={12} /> Add Stop
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                    {routeStops.map((stop, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', fontWeight: 700, width: '18px' }}>{idx + 1}.</span>
                        <input
                          type="text"
                          placeholder="Stop Name"
                          value={stop.name}
                          onChange={(e) => handleStopFieldChange(idx, 'name', e.target.value)}
                          style={{ flex: 2, padding: '6px 8px', fontSize: '0.8rem' }}
                          required
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Lat"
                          value={stop.lat}
                          onChange={(e) => handleStopFieldChange(idx, 'lat', e.target.value)}
                          style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem' }}
                          required
                        />
                        <input
                          type="number"
                          step="any"
                          placeholder="Lng"
                          value={stop.lng}
                          onChange={(e) => handleStopFieldChange(idx, 'lng', e.target.value)}
                          style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem' }}
                          required
                        />
                        {routeStops.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStopField(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-danger)',
                              padding: '4px'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#090a0f',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  marginTop: '6px'
                }}>
                  {loading ? 'Creating Route...' : 'Create Route'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="glass-panel" style={{ flex: 1, padding: '24px', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px' }}>Route Directory</h3>
              {routes.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No routes configured.</div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Route ID</th>
                      <th>City</th>
                      <th>Terminals</th>
                      <th>Stops</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map(route => (
                      <tr key={route._id}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{route.name}</td>
                        <td>{route.city ? route.city.name : 'Unknown'}</td>
                        <td>{route.startLocation} → {route.endLocation}</td>
                        <td>
                          <span style={{
                            backgroundColor: 'rgba(0, 210, 255, 0.1)',
                            color: 'var(--color-primary)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}>
                            {route.stops?.length || 0} stops
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => deleteEntity('/routes', route._id, route.name)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-text-dim)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-dim)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* 3. DRIVERS TAB */}
        {activeTab === 'drivers' && (
          <>
            {/* Create form */}
            <div className="glass-panel admin-panel-form" style={{ width: '360px', padding: '24px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="var(--color-primary)" />
                Enroll New Driver
              </h3>
              <form onSubmit={handleDriverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Full Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>License Number</label>
                  <input type="text" placeholder="e.g. NY-LIC-12345" value={driverLic} onChange={(e) => setDriverLic(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Contact Phone</label>
                  <input type="text" placeholder="e.g. +1 (555) 123-4567" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Status</label>
                  <select value={driverStatus} onChange={(e) => setDriverStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Off-Duty">Off-Duty</option>
                  </select>
                </div>

                <button type="submit" disabled={loading} style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#090a0f',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  marginTop: '6px'
                }}>
                  {loading ? 'Enrolling...' : 'Enroll Driver'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="glass-panel" style={{ flex: 1, padding: '24px', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px' }}>Drivers Directory</h3>
              {drivers.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No drivers enrolled.</div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Driver Name</th>
                      <th>License Number</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map(driver => (
                      <tr key={driver._id}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{driver.name}</td>
                        <td>{driver.licenseNumber}</td>
                        <td>{driver.phone}</td>
                        <td>
                          <span style={{
                            backgroundColor: 
                              driver.status === 'Available' ? 'rgba(16, 185, 129, 0.1)' : 
                              driver.status === 'Busy' ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            color: 
                              driver.status === 'Available' ? 'var(--color-success)' : 
                              driver.status === 'Busy' ? 'var(--color-primary)' : 'var(--color-text-dim)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}>
                            {driver.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => deleteEntity('/drivers', driver._id, driver.name)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-text-dim)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-dim)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* 4. CITIES TAB */}
        {activeTab === 'cities' && isSuperAdmin && (
          <>
            {/* Create form */}
            <div className="glass-panel admin-panel-form" style={{ width: '360px', padding: '24px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--color-primary)" />
                Register New City
              </h3>
              <form onSubmit={handleCitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>City Name</label>
                  <input type="text" placeholder="e.g. Mumbai" value={cityName} onChange={(e) => setCityName(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Country</label>
                  <input type="text" placeholder="e.g. India" value={cityCountry} onChange={(e) => setCityCountry(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Center Latitude</label>
                    <input type="number" step="any" placeholder="19.0760" value={cityLat} onChange={(e) => setCityLat(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Center Longitude</label>
                    <input type="number" step="any" placeholder="72.8777" value={cityLng} onChange={(e) => setCityLng(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#090a0f',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  marginTop: '6px'
                }}>
                  {loading ? 'Creating...' : 'Register City'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="glass-panel" style={{ flex: 1, padding: '24px', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '16px' }}>Nodes Directory</h3>
              {cities.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No cities created.</div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>City</th>
                      <th>Country</th>
                      <th>Map Anchor center</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map(city => (
                      <tr key={city._id}>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{city.name}</td>
                        <td>{city.country}</td>
                        <td>{city.centerCoordinates?.lat?.toFixed(4)}, {city.centerCoordinates?.lng?.toFixed(4)}</td>
                        <td>
                          <button
                            onClick={() => deleteEntity('/cities', city._id, city.name)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-text-dim)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-dim)'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

      </div>

    </div>
  );
};

export default AdminPanel;
