import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useSocket } from '../context/SocketContext';

// Helper to create the custom rotating bus marker based on crowd density and movement direction
const createBusIcon = (bus) => {
  const crowdClass = 
    bus.crowdLevel === 'High' ? 'high-crowd' : 
    bus.crowdLevel === 'Medium' ? 'med-crowd' : 'low-crowd';
  
  const rotation = bus.direction || 0;
  
  // Choose pointer color based on crowd density
  const pointerColor = 
    bus.crowdLevel === 'High' ? '#ef4444' : 
    bus.crowdLevel === 'Medium' ? '#f59e0b' : '#10b981';

  return L.divIcon({
    className: 'bus-marker-icon',
    html: `
      <div class="bus-marker-wrapper ${crowdClass}" style="transform: rotate(${rotation}deg); position: relative;">
        <!-- Direction pointer arrow -->
        <div style="
          position: absolute; 
          top: -6px; 
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent; 
          border-right: 6px solid transparent; 
          border-bottom: 8px solid ${pointerColor};
        "></div>
        <div class="bus-marker-inner">
          <!-- SVG Bus Icon -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="6" y1="21" x2="6" y2="17"></line>
            <line x1="18" y1="21" x2="18" y2="17"></line>
            <path d="M4 11h16"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

// Helper for stop marker
const createStopIcon = (stop, isActiveStop) => {
  return L.divIcon({
    className: 'stop-marker-icon',
    html: `<div class="stop-marker-wrapper ${isActiveStop ? 'active-stop' : ''}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

const LeafletMap = ({ 
  selectedCity, 
  selectedRoute, 
  selectedBus, 
  onBusSelect,
  mapFocusTrigger
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const busMarkersRef = useRef({});
  const stopMarkersRef = useRef([]);
  const routePolylineRef = useRef(null);
  const { realtimeBuses } = useSocket();

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Mumbai center default coordinates
    const defaultCenter = [19.0760, 72.8777];
    const defaultZoom = 12;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false, // We will add zoom control on the bottom-right
      attributionControl: false,
    });

    // Sleek Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Fly to City Center when selectedCity changes
  useEffect(() => {
    if (!mapRef.current || !selectedCity) return;
    
    const center = selectedCity.centerCoordinates;
    if (center && center.lat && center.lng) {
      mapRef.current.flyTo([center.lat, center.lng], 12, {
        duration: 1.5,
      });
    }
  }, [selectedCity]);

  // 2b. Fly to custom targets on demand (Bus focus or Route bounds)
  useEffect(() => {
    if (!mapRef.current || !mapFocusTrigger) return;
    
    const map = mapRef.current;
    
    if (mapFocusTrigger.type === 'bus' && selectedBus) {
      const liveBus = realtimeBuses.find(b => b.busId === (selectedBus._id || selectedBus.busId));
      if (liveBus) {
        map.flyTo([liveBus.currentCoordinates.lat, liveBus.currentCoordinates.lng], 14, {
          animate: true,
          duration: 1.0
        });
      } else if (selectedBus.currentCoordinates) {
        map.flyTo([selectedBus.currentCoordinates.lat, selectedBus.currentCoordinates.lng], 14, {
          animate: true,
          duration: 1.0
        });
      }
    } else if (mapFocusTrigger.type === 'route' && routePolylineRef.current) {
      try {
        map.fitBounds(routePolylineRef.current.getBounds(), {
          padding: [50, 50],
          animate: true,
          duration: 1.0
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [mapFocusTrigger]);

  // 3. Draw Selected Route Path and Stops
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old route path
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // Clear old stops
    stopMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    stopMarkersRef.current = [];

    if (!selectedRoute) return;

    // Draw route path line
    if (selectedRoute.path && selectedRoute.path.length > 0) {
      const latLngs = selectedRoute.path.map((coord) => new L.LatLng(coord[0], coord[1]));
      
      routePolylineRef.current = L.polyline(latLngs, {
        color: 'var(--color-primary)',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8', // Animated dashes look premium
        lineCap: 'round',
      }).addTo(map);

      // Fit map bounds to route
      try {
        map.fitBounds(routePolylineRef.current.getBounds(), {
          padding: [50, 50],
          maxZoom: 14,
          animate: true,
          duration: 1.2
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Draw stops
    if (selectedRoute.stops && selectedRoute.stops.length > 0) {
      selectedRoute.stops.forEach((stop) => {
        const isSelectedBusRouteStop = selectedBus && selectedBus.route && selectedBus.route._id === selectedRoute._id;
        const marker = L.marker([stop.lat, stop.lng], {
          icon: createStopIcon(stop, isSelectedBusRouteStop),
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: 'Outfit'; padding: 2px;">
            <div style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600; text-transform: uppercase;">Stop ${stop.stopIndex + 1}</div>
            <div style="font-size: 0.9rem; font-weight: 600; color: #fff; margin-top: 2px;">${stop.name}</div>
          </div>
        `);

        stopMarkersRef.current.push(marker);
      });
    }
  }, [selectedRoute, selectedBus]);

  // 4. Update Live Bus Markers in Real-time
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Filter buses based on selection
    let busesToRender = realtimeBuses;
    
    if (selectedBus) {
      // If a single bus is selected, we focus on it
      busesToRender = realtimeBuses.filter((b) => b.busId === selectedBus._id);
    } else if (selectedRoute) {
      // Filter by route
      busesToRender = realtimeBuses.filter((b) => b.routeId === selectedRoute._id);
    } else if (selectedCity) {
      // We don't have cityId on realtime buses directly, but we can filter by matching city in populated routes.
      // We will check if the routes' city match.
      // Wait, we populated routeName, etc. Let's filter buses by city if needed
    }

    const currentBusIds = {};

    busesToRender.forEach((bus) => {
      const busId = bus.busId;
      const coords = [bus.currentCoordinates.lat, bus.currentCoordinates.lng];
      currentBusIds[busId] = true;

      const existingMarker = busMarkersRef.current[busId];

      if (existingMarker) {
        // Update marker position
        existingMarker.setLatLng(coords);
        // Update marker rotation & look (for direction/crowd update)
        existingMarker.setIcon(createBusIcon(bus));
        
        // Update popup info if open
        const popup = existingMarker.getPopup();
        if (popup) {
          popup.setContent(getPopupContent(bus));
        }
      } else {
        // Create new marker
        const marker = L.marker(coords, {
          icon: createBusIcon(bus),
        }).addTo(map);

        marker.bindPopup(getPopupContent(bus));
        
        // Handle click event on marker
        marker.on('click', () => {
          if (onBusSelect) {
            onBusSelect(bus);
          }
        });

        busMarkersRef.current[busId] = marker;
      }
    });

    // Remove any markers that are no longer in the active list
    Object.keys(busMarkersRef.current).forEach((busId) => {
      if (!currentBusIds[busId]) {
        map.removeLayer(busMarkersRef.current[busId]);
        delete busMarkersRef.current[busId];
      }
    });

    // Pan map to selected bus if it moves
    if (selectedBus && busesToRender.length > 0) {
      const selectedBusRealtime = busesToRender[0];
      const coords = [selectedBusRealtime.currentCoordinates.lat, selectedBusRealtime.currentCoordinates.lng];
      // Smoothly pan to the bus position
      map.panTo(coords, { animate: true, duration: 0.5 });
    }

  }, [realtimeBuses, selectedRoute, selectedBus, onBusSelect]);

  const getPopupContent = (bus) => {
    const crowdColor = 
      bus.crowdLevel === 'High' ? 'var(--color-danger)' : 
      bus.crowdLevel === 'Medium' ? 'var(--color-warning)' : 'var(--color-success)';

    return `
      <div style="font-family: 'Outfit', sans-serif; min-width: 160px; padding: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 6px;">
          <span style="font-size: 0.95rem; font-weight: 700; color: #fff;">Bus ${bus.busNumber}</span>
          <span style="font-size: 0.75rem; font-weight: 600; color: ${crowdColor}; text-transform: uppercase;">${bus.crowdLevel} Crowd</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 4px;">
          <strong>Route:</strong> ${bus.routeName}
        </div>
        <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 4px;">
          <strong>Speed:</strong> ${bus.speed} km/h
        </div>
        <div style="font-size: 0.8rem; color: var(--color-text-muted);">
          <strong>Driver:</strong> ${bus.driverName}
        </div>
      </div>
    `;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Sleek map border reflection */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
        zIndex: 500,
      }}></div>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default LeafletMap;
