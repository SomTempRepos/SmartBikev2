import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, Popup } from 'react-leaflet';
import { Icon, LatLng } from 'leaflet';
import { Socket, io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

// Type definitions
interface Location {
  lat: number;
  lng: number;
}

interface BikeData {
  location: Location;
  avgSpeed: string;
  battery: string;
}

interface BikeUpdateData {
  bikeId: string;
  data: BikeData;
  timestamp: string;
}

interface Bike {
  bikeId: string;
  currentLocation: Location;
  avgSpeed: number;
  batteryLevel: number;
  lastSeen: string;
  status: string;
  isOutsideFence: boolean;
  distanceFromBase: number;
}

interface Alert {
  id: number;
  bikeId: string;
  type: 'fence_breach';
  message: string;
  distance: string;
  timestamp: string;
}

interface MapClickHandlerProps {
  onMapClick: (latlng: LatLng) => void;
}

interface BikeApiResponse {
  bikes: Bike[];
}

// Fix for default markers in react-leaflet
const defaultIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom bike icon for in-fence bikes
const bikeIconGreen = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
});

// Custom bike icon for out-of-fence bikes
const bikeIconRed = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
});

function MapClickHandler({ onMapClick }: MapClickHandlerProps): null {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

export default function GeoFencing(): JSX.Element {
  const [baseLocation, setBaseLocation] = useState<Location>({
    lat: 19.0760,
    lng: 72.8777
  });
  const [radius, setRadius] = useState<number>(1); // in kilometers
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!trackingEnabled) return;
    
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
        
        const updatedBike: Bike = {
          bikeId: data.bikeId,
          currentLocation: data.data.location,
          avgSpeed: parseFloat(data.data.avgSpeed),
          batteryLevel: parseFloat(data.data.battery),
          lastSeen: data.timestamp,
          status: 'active',
          isOutsideFence: false,
          distanceFromBase: 0
        };

        // Check if bike is outside fence
        if (data.data.location) {
          const distance = calculateDistance(
            baseLocation.lat,
            baseLocation.lng,
            data.data.location.lat,
            data.data.location.lng
          );
          
          updatedBike.isOutsideFence = distance > radius;
          updatedBike.distanceFromBase = distance;

          // Create alert if bike goes outside fence
          if (updatedBike.isOutsideFence) {
            const existingBike = prevBikes.find(bike => bike.bikeId === data.bikeId);
            if (!existingBike || !existingBike.isOutsideFence) {
              // Bike just went outside fence
              const newAlert: Alert = {
                id: Date.now(),
                bikeId: data.bikeId,
                type: 'fence_breach',
                message: `Bike ${data.bikeId} has left the geo-fence area`,
                distance: distance.toFixed(2),
                timestamp: new Date().toLocaleTimeString()
              };
              setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep last 5 alerts
            }
          }
        }

        if (existingBikeIndex !== -1) {
          const updatedBikes = [...prevBikes];
          updatedBikes[existingBikeIndex] = updatedBike;
          return updatedBikes;
        } else {
          return [...prevBikes, updatedBike];
        }
      });
    });

    // Fetch initial bike data
    fetchBikes();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [trackingEnabled, baseLocation, radius]);

  const fetchBikes = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:3001/api/bikes');
      const data: BikeApiResponse = await response.json();
      if (data.bikes) {
        // Process bikes to check fence status
        const processedBikes: Bike[] = data.bikes.map(bike => {
          if (bike.currentLocation) {
            const distance = calculateDistance(
              baseLocation.lat,
              baseLocation.lng,
              bike.currentLocation.lat,
              bike.currentLocation.lng
            );
            return {
              ...bike,
              isOutsideFence: distance > radius,
              distanceFromBase: distance
            };
          }
          return bike;
        });
        setBikes(processedBikes);
      }
    } catch (error) {
      console.error('Error fetching bikes:', error);
    }
  };

  const handleMapClick = useCallback((latlng: LatLng): void => {
    setBaseLocation({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);
    if (value > 0) {
      setRadius(value);
    }
  };

  const toggleTracking = (): void => {
    setTrackingEnabled(!trackingEnabled);
    if (!trackingEnabled) {
      setBikes([]);
      setAlerts([]);
    }
  };

  const clearAlerts = (): void => {
    setAlerts([]);
  };

  const bikesInFence: Bike[] = bikes.filter(bike => !bike.isOutsideFence);
  const bikesOutsideFence: Bike[] = bikes.filter(bike => bike.isOutsideFence);

  return (
    <div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mb-8">
          <h3 className="mb-4 text-center font-semibold text-gray-800 text-2xl dark:text-white/90">
            Geo Fencing with Live Bike Tracking
          </h3>
          
          {/* Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Radius (km)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={radius}
                  onChange={handleRadiusChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Radius in km"
                />
                {/* {Buttons} */}
              <div className="flex itme-centre gap-2 p-4 ">
                <button
                  onClick={toggleTracking}
                  className={`px-4 py-3 rounded-md font-medium text-sm ${
                    trackingEnabled
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {trackingEnabled ? 'Stop Tracking' : 'Start Tracking'}
                </button>
                
                {trackingEnabled && (
                  <button
                    onClick={fetchBikes}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium text-sm hover:bg-blue-600"
                  >
                    Refresh
                  </button>
                )}
              </div>
              </div>
              
              
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
        {/* Bike Status and Formula */}
        {trackingEnabled && bikes.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Bike Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bikes.map(bike => (
                <div
                  key={bike.bikeId}
                  className={`p-3 rounded-lg border-2 ${
                    bike.isOutsideFence 
                      ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20' 
                      : 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-800 dark:text-white">{bike.bikeId}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Distance: {bike.distanceFromBase ? `${bike.distanceFromBase.toFixed(2)} km` : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Speed: {bike.avgSpeed ? `${bike.avgSpeed.toFixed(1)} km/h` : 'N/A'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      bike.isOutsideFence 
                        ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' 
                        : 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                    }`}>
                      {bike.isOutsideFence ? 'Outside' : 'Inside'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
       </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>💡 Click on the map to set a new base location</p>
              {lastUpdate && <p>Last update: {lastUpdate}</p>}
            </div>
            
      </div>
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-red-800 dark:text-red-300">Recent Alerts</h4>
                <button
                  onClick={clearAlerts}
                  className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className="text-sm text-red-700 dark:text-red-300">
                    <span className="font-medium">{alert.timestamp}:</span> {alert.message} ({alert.distance} km from base)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <MapContainer
            center={[baseLocation.lat, baseLocation.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            key={`${baseLocation.lat}-${baseLocation.lng}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onMapClick={handleMapClick} />
            
            {/* Base location marker */}
            <Marker 
              position={[baseLocation.lat, baseLocation.lng]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">Base Location</h3>
                  <p className="text-sm">Lat: {baseLocation.lat.toFixed(6)}</p>
                  <p className="text-sm">Lng: {baseLocation.lng.toFixed(6)}</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Geo fence circle */}
            <Circle
              center={[baseLocation.lat, baseLocation.lng]}
              radius={radius * 1000} // Convert km to meters
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                weight: 2
              }}
            />

            {/* Bike markers */}
            {trackingEnabled && bikes.map((bike) => (
              bike.currentLocation && (
                <Marker
                  key={bike.bikeId}
                  position={[bike.currentLocation.lat, bike.currentLocation.lng]}
                  icon={bike.isOutsideFence ? bikeIconRed : bikeIconGreen}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">{bike.bikeId}</h3>
                      <p className="text-sm">Speed: {bike.avgSpeed ? `${bike.avgSpeed.toFixed(1)} km/h` : 'N/A'}</p>
                      <p className="text-sm">Battery: {bike.batteryLevel ? `${bike.batteryLevel.toFixed(0)}%` : 'N/A'}</p>
                      <p className="text-sm">Distance from base: {bike.distanceFromBase ? `${bike.distanceFromBase.toFixed(2)} km` : 'N/A'}</p>
                      <p className={`text-sm font-medium ${bike.isOutsideFence ? 'text-red-600' : 'text-green-600'}`}>
                        Status: {bike.isOutsideFence ? 'Outside Fence' : 'Inside Fence'}
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
          </MapContainer>
        </div>
        
        {/* Geo Fence Info Panel */}
        <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Geo Fence Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Base Location:</span>
              <p className="font-medium text-gray-800 dark:text-white">
                {baseLocation.lat.toFixed(6)}, {baseLocation.lng.toFixed(6)}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Radius:</span>
              <p className="font-medium text-gray-800 dark:text-white">{radius} km</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Area:</span>
              <p className="font-medium text-gray-800 dark:text-white">
                {(Math.PI * radius * radius).toFixed(2)} km²
              </p>
            </div>
          </div>
           {/* Stats */}
          {trackingEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300">Inside Fence</h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{bikesInFence.length}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 dark:text-red-300">Outside Fence</h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{bikesOutsideFence.length}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300">Total Bikes</h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{bikes.length}</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}