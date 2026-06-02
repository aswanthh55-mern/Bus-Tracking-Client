import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { Bus, User, Phone, MapPin, Gauge, Users, Search, Filter } from 'lucide-react';

const Buses = () => {
  const { realtimeBuses } = useSocket();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [crowdFilter, setCrowdFilter] = useState('all');

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const { data } = await api.get('/buses');
        setBuses(data);
      } catch (error) {
        console.error('Error fetching buses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  // Map database buses with real-time updates from socket
  const getMergedBuses = () => {
    return buses.map((dbBus) => {
      // Find matching live bus in socket feed
      const liveBus = realtimeBuses.find((b) => b.busId === dbBus._id);
      if (liveBus) {
        return {
          ...dbBus,
          currentCoordinates: liveBus.currentCoordinates,
          speed: liveBus.speed,
          crowdLevel: liveBus.crowdLevel,
          status: liveBus.status, // might have changed to Active/Inactive dynamically
        };
      }
      return dbBus;
    });
  };

  const mergedBuses = getMergedBuses();

  // Filtering
  const filteredBuses = mergedBuses.filter((bus) => {
    const matchesSearch =
      bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bus.driver && bus.driver.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bus.model && bus.model.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
    const matchesCrowd = crowdFilter === 'all' || bus.crowdLevel === crowdFilter;

    return matchesSearch && matchesStatus && matchesCrowd;
  });

  const getCrowdBadgeStyles = (level) => {
    switch (level) {
      case 'High':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      case 'Medium':
        return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' };
      case 'Low':
      default:
        return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
    }
  };

  return (
    <div style={{ padding: '0 20px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Info Panel */}
      <div className="glass-panel" style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Transit Fleet Management</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Monitor crowd levels, driver logs, and live telemetry across all active buses.
          </p>
        </div>
        
        {/* Quick Fleet Metrics */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            padding: '10px 16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Active Fleet</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '2px' }}>
              {mergedBuses.filter(b => b.status === 'Active').length} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>/ {mergedBuses.length}</span>
            </div>
          </div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            padding: '10px 16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Maintenance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '2px' }}>
              {mergedBuses.filter(b => b.status === 'Maintenance').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--color-text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by plate number, driver, or bus model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', background: 'rgba(0,0,0,0.2)' }}
          />
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--color-text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={14} color="var(--color-text-muted)" />
            <select
              value={crowdFilter}
              onChange={(e) => setCrowdFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <option value="all">All Crowd Levels</option>
              <option value="Low">Low Density</option>
              <option value="Medium">Medium Density</option>
              <option value="High">High Density</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bus Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-primary)' }}>Loading fleet registries...</div>
      ) : filteredBuses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No buses found matching your criteria.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {filteredBuses.map((bus) => {
            const crowdBadge = getCrowdBadgeStyles(bus.crowdLevel);
            const statusLabel = 
              bus.status === 'Active' ? 'ACTIVE & MOVING' : 
              bus.status === 'Maintenance' ? 'UNDER REPAIR' : 'STANDBY IDLE';

            return (
              <div key={bus._id} className="glass-panel glass-card" style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {/* Plate & Status */}
                <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      backgroundColor: 'rgba(0, 210, 255, 0.1)',
                      color: 'var(--color-primary)',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Bus size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{bus.busNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{bus.model || 'Standard Coach'}</div>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`status-dot ${bus.status.toLowerCase()}`}></span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      color: bus.status === 'Active' ? 'var(--color-success)' : bus.status === 'Maintenance' ? 'var(--color-warning)' : 'var(--color-text-muted)'
                    }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* Route Card Section */}
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.015)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <MapPin size={12} color="var(--color-primary)" />
                    <span>ASSIGNED ROUTE</span>
                  </div>
                  {bus.route ? (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{bus.route.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{bus.route.startLocation} → {bus.route.endLocation}</span>
                        <span style={{ color: 'var(--color-primary)' }}>{bus.route.stops?.length || 0} stops</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', fontStyle: 'italic' }}>
                      No route assigned
                    </div>
                  )}
                </div>

                {/* Speed & Crowd level */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Speed */}
                  <div style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <Gauge size={14} color="var(--color-text-muted)" />
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>LIVE SPEED</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: bus.status === 'Active' ? 'var(--color-primary)' : 'var(--color-text-dim)' }}>
                      {bus.status === 'Active' ? `${bus.speed || 0} km/h` : '0 km/h'}
                    </div>
                  </div>

                  {/* Crowd Level */}
                  <div style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    backgroundColor: crowdBadge.bg,
                    borderColor: crowdBadge.border,
                  }}>
                    <Users size={14} color={crowdBadge.text} />
                    <div style={{ fontSize: '0.7rem', color: crowdBadge.text, fontWeight: 500 }}>CROWD LEVEL</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: crowdBadge.text }}>
                      {bus.crowdLevel}
                    </div>
                  </div>
                </div>

                {/* Driver Profile */}
                <div style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  {bus.driver ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-muted)'
                        }}>
                          <User size={12} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{bus.driver.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>Lic: {bus.driver.licenseNumber}</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <Phone size={10} color="var(--color-primary)" />
                        <span>{bus.driver.phone}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', fontStyle: 'italic', width: '100%', textAlign: 'center' }}>
                      No operator driver assigned
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Buses;
