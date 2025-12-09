import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: 'worker' | 'business';
  popupContent?: string;
  photoUrl?: string | null;
  initials?: string;
}

interface LocationMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
}

export function LocationMap({
  markers,
  center = [51.5074, -0.1278], // Default to London
  zoom = 10,
  height = '400px',
  className,
  onMarkerClick,
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Helper function to create avatar marker icon - colored circles based on type
    const createAvatarIcon = (markerData: MapMarker) => {
      // Purple for workers/professionals, Gold for businesses
      const bgColor = markerData.type === 'worker' ? 'hsl(252, 76%, 60%)' : 'hsl(42, 65%, 53%)';
      const initials = markerData.initials || markerData.label.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 12px; font-weight: 600; color: white;">${initials}</span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    };

    // Add markers
    markers.forEach((markerData) => {
      const icon = createAvatarIcon(markerData);
      const marker = L.marker([markerData.lat, markerData.lng], { icon });

      if (markerData.popupContent || markerData.label) {
        marker.bindPopup(markerData.popupContent || markerData.label);
      }

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(markerData));
      }

      marker.addTo(mapInstanceRef.current!);
      markersRef.current.push(marker);
    });

    // Fit bounds if there are markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, onMarkerClick]);

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ height, width: '100%', borderRadius: '8px' }}
    />
  );
}
