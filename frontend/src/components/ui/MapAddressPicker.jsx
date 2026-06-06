import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// A component to catch map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          setPosition(e.target.getLatLng());
        },
      }}
    />
  );
}

function MapController({ centerPosition }) {
  const map = useMap();
  useEffect(() => {
    if (centerPosition) {
      map.flyTo(centerPosition, 14);
    }
  }, [centerPosition, map]);
  return null;
}

export function MapAddressPicker({ onLocationChange }) {
  const defaultCenter = { lat: 21.7411471, lng: 72.0706172 }; // Default to warehouse vicinity
  const [position, setPosition] = useState(null);
  const [flyToPosition, setFlyToPosition] = useState(null);

  useEffect(() => {
    if (position) {
      onLocationChange(position.lat, position.lng);
    }
  }, [position, onLocationChange]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          setFlyToPosition(newPos);
        },
        () => {
          alert("Unable to retrieve your location. Please click on the map to set your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Delivery Location (Map) *
        </label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleUseCurrentLocation}
          className="h-8 text-xs flex items-center gap-1.5"
        >
          <MapPin size={14} /> Use Current Location
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Click on the map or drag the marker to set your exact delivery location.</p>
      
      <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border">
        <MapContainer 
          center={defaultCenter} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController centerPosition={flyToPosition} />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>
      {position && (
        <div className="text-sm font-medium text-primary bg-primary/10 p-2 rounded-md">
          Selected Coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}
