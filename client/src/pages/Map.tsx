import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import io, { Socket } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

// Type definitions
interface Location {
  lat: number;
  lng: number;
}

interface Bike {
  bikeId: string;
  currentLocation: Location | null;
  avgSpeed: number;
  batteryLevel: number;
  lastSeen: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface BikeUpdateData {
  bikeId: string;
  data: {
    location: Location;
    avgSpeed: string;
    battery: string;
  };
  timestamp: string;
}

interface BikeApiResponse {
  bikes: Bike[];
}

interface Routes {
  [bikeId: string]: [number, number][];
}

interface MapControllerProps {
  bikes: Bike[];
  followBike: string | null;
}

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bike icon
const bikeIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
      <path d="M6 18h8l2-8h3l-2 8"/>
      <path d="M6 18l-1-4h4l1 4"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  className: 'bike-marker'
});

// Component to update map view when bikes are added
const MapController: React.FC<MapControllerProps> = ({ bikes, followBike }) => {
  const map = useMap();
  
  useEffect(() => {
    if (followBike && bikes.length > 0) {
      const bike = bikes.find(b => b.bikeId === followBike);
      if (bike && bike.currentLocation) {
        map.setView([bike.currentLocation.lat, bike.currentLocation.lng], 16);
      }
    } else if (bikes.length > 0) {
      // Fit map to show all bikes
      const bounds = bikes
        .filter(bike => bike.currentLocation)
        .map(bike => [bike.currentLocation!.lat, bike.currentLocation!.lng]) as [number, number][];
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [bikes, followBike, map]);
  
  return null;
};

const BikeTrackingMap: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [routes, setRoutes] = useState<Routes>({});
  const [isTrackingRoutes, setIsTrackingRoutes] = useState<boolean>(false);
  const [followBike, setFollowBike] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    // Replace with your server URL
    const SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL;
    
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketRef.current.on('bikeUpdate', (data: BikeUpdateData) => {
      console.log('Received bike update:', data);
      setLastUpdate(new Date().toLocaleTimeString());
      
      setBikes(prevBikes => {
        const existingBikeIndex = prevBikes.findIndex(bike => bike.bikeId === data.bikeId);
        
        if (existingBikeIndex !== -1) {
          // Update existing bike
          const updatedBikes = [...prevBikes];
          updatedBikes[existingBikeIndex] = {
            ...updatedBikes[existingBikeIndex],
            currentLocation: data.data.location,
            avgSpeed: parseFloat(data.data.avgSpeed),
            batteryLevel: parseFloat(data.data.battery),
            lastSeen: data.timestamp
          };
          return updatedBikes;
        } else {
          // Add new bike
          const newBike: Bike = {
            bikeId: data.bikeId,
            currentLocation: data.data.location,
            avgSpeed: parseFloat(data.data.avgSpeed),
            batteryLevel: parseFloat(data.data.battery),
            lastSeen: data.timestamp,
            status: 'active'
          };
          return [...prevBikes, newBike];
        }
      });

      // Update routes if tracking is enabled
      if (isTrackingRoutes && data.data.location) {
        setRoutes(prevRoutes => {
          const bikeRoute = prevRoutes[data.bikeId] || [];
          const newPoint: [number, number] = [data.data.location.lat, data.data.location.lng];
          
          // Avoid duplicate points
          const lastPoint = bikeRoute[bikeRoute.length - 1];
          if (!lastPoint || lastPoint[0] !== newPoint[0] || lastPoint[1] !== newPoint[1]) {
            return {
              ...prevRoutes,
              [data.bikeId]: [...bikeRoute, newPoint]
            };
          }
          
          return prevRoutes;
        });
      }
    });

    // Fetch initial bike data
    fetchBikes();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isTrackingRoutes]);

  const fetchBikes = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3001/api/bikes');
      const data: BikeApiResponse = await response.json();
      if (data.bikes) {
        setBikes(data.bikes);
      }
    } catch (error) {
      console.error('Error fetching bikes:', error);
    }
  };

  const startRouteTracking = (): void => {
    setIsTrackingRoutes(true);
    setRoutes({});
    
    // Initialize routes with current bike positions
    bikes.forEach(bike => {
      if (bike.currentLocation) {
        setRoutes(prevRoutes => ({
          ...prevRoutes,
          [bike.bikeId]: [[bike.currentLocation!.lat, bike.currentLocation!.lng]]
        }));
      }
    });
  };

  const stopRouteTracking = (): void => {
    setIsTrackingRoutes(false);
  };

  const clearRoutes = (): void => {
    setRoutes({});
  };

  const followBikeHandler = (bikeId: string): void => {
    setFollowBike(followBike === bikeId ? null : bikeId);
  };

  const getBatteryColor = (level: number): string => {
    if (level > 50) return '#10B981'; // green
    if (level > 20) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const getRouteColor = (bikeId: string): string => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
    return colors[bikes.findIndex(b => b.bikeId === bikeId) % colors.length];
  };

  // Default center (you can change this to your preferred location)
  const defaultCenter: [number, number] = [19.0760, 72.8777]; // Mumbai coordinates

  return (
    <div className="w-full h-screen relative">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Bike Tracking</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {lastUpdate && (
          <p className="text-xs text-gray-500 mb-3">Last update: {lastUpdate}</p>
        )}
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={isTrackingRoutes ? stopRouteTracking : startRouteTracking}
              className={`flex-1 px-3 py-2 rounded text-sm font-medium ${
                isTrackingRoutes
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isTrackingRoutes ? 'Stop Tracking' : 'Start Route Tracking'}
            </button>
            
            <button
              onClick={clearRoutes}
              className="px-3 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600"
            >
              Clear Routes
            </button>
          </div>
          
          <button
            onClick={fetchBikes}
            className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600"
          >
            Refresh Bikes
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Active Bikes ({bikes.length})</h3>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {bikes.map((bike) => (
              <div
                key={bike.bikeId}
                className={`p-2 rounded text-xs cursor-pointer ${
                  followBike === bike.bikeId
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => followBikeHandler(bike.bikeId)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{bike.bikeId}</span>
                  <span className="text-xs text-gray-500">
                    {bike.avgSpeed ? `${bike.avgSpeed.toFixed(1)} km/h` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span
                    className="text-xs px-1 rounded"
                    style={{
                      backgroundColor: getBatteryColor(bike.batteryLevel || 0),
                      color: 'white'
                    }}
                  >
                    {bike.batteryLevel ? `${bike.batteryLevel.toFixed(0)}%` : 'N/A'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {followBike === bike.bikeId ? 'Following' : 'Click to follow'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController bikes={bikes} followBike={followBike} />
        
        {/* Bike Markers */}
        {bikes.map((bike) => (
          bike.currentLocation && (
            <Marker
              key={bike.bikeId}
              position={[bike.currentLocation.lat, bike.currentLocation.lng]}
              icon={bikeIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{bike.bikeId}</h3>
                  <p className="text-sm">Speed: {bike.avgSpeed ? `${bike.avgSpeed.toFixed(1)} km/h` : 'N/A'}</p>
                  <p className="text-sm">Battery: {bike.batteryLevel ? `${bike.batteryLevel.toFixed(0)}%` : 'N/A'}</p>
                  <p className="text-sm">
                    Location: {bike.currentLocation.lat.toFixed(6)}, {bike.currentLocation.lng.toFixed(6)}
                  </p>
                  {bike.lastSeen && (
                    <p className="text-xs text-gray-500">
                      Last seen: {new Date(bike.lastSeen).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}
        
        {/* Route Polylines */}
        {isTrackingRoutes && Object.entries(routes).map(([bikeId, route]) => (
          route.length > 1 && (
            <Polyline
              key={bikeId}
              positions={route}
              color={getRouteColor(bikeId)}
              weight={3}
              opacity={0.7}
            />
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default BikeTrackingMap;