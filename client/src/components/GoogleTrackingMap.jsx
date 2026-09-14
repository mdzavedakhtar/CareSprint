import { useEffect, useRef, useState, useMemo } from "react";
import { MapPin, Navigation, Radio, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

/**
 * Production-ready Google Maps Tracking Component with Auto-Fit, Live Markers, Route & Graceful Fallback.
 */
const GoogleTrackingMap = ({
  patientLocation,
  doctorLocation,
  doctorName = "Doctor",
  distanceKm = null,
  etaMinutes = null,
  status = "DOCTOR_ON_THE_WAY",
}) => {
  const mapRef = useRef(null);
  const googleMapObj = useRef(null);
  const doctorMarkerRef = useRef(null);
  const patientMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  // Extract coordinates safely [lng, lat] -> { lat, lng }
  const patientLatLng = useMemo(() => {
    const coords = patientLocation?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      return { lat: Number(coords[1]), lng: Number(coords[0]) };
    }
    return null;
  }, [patientLocation]);

  const doctorLatLng = useMemo(() => {
    const coords = doctorLocation?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      return { lat: Number(coords[1]), lng: Number(coords[0]) };
    }
    return null;
  }, [doctorLocation]);

  // Load Google Maps Script
  useEffect(() => {
    if (!apiKey) {
      setLoadError(true);
      return;
    }

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setMapLoaded(true);
      };

      script.onerror = () => {
        console.warn("[GoogleTrackingMap] Failed to load Google Maps script");
        setLoadError(true);
      };

      document.head.appendChild(script);
    } else {
      script.addEventListener("load", () => setMapLoaded(true));
    }
  }, [apiKey]);

  // Initialize Map & Markers
  useEffect(() => {
    if (!mapLoaded || !window.google || !mapRef.current || loadError) return;

    try {
      const center = doctorLatLng || patientLatLng || { lat: 21.19, lng: 81.35 };

      if (!googleMapObj.current) {
        googleMapObj.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
      }

      const map = googleMapObj.current;
      const bounds = new window.google.maps.LatLngBounds();

      // Throttling location updates (max once per 3s)
      const now = Date.now();
      if (now - lastUpdateRef.current < 3000 && doctorMarkerRef.current) {
        return;
      }
      lastUpdateRef.current = now;

      // Patient Marker
      if (patientLatLng) {
        bounds.extend(patientLatLng);
        if (!patientMarkerRef.current) {
          patientMarkerRef.current = new window.google.maps.Marker({
            position: patientLatLng,
            map,
            title: "Patient Destination",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#ef4444",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
        } else {
          patientMarkerRef.current.setPosition(patientLatLng);
        }
      }

      // Doctor Marker
      if (doctorLatLng) {
        bounds.extend(doctorLatLng);
        if (!doctorMarkerRef.current) {
          doctorMarkerRef.current = new window.google.maps.Marker({
            position: doctorLatLng,
            map,
            title: `Dr. ${doctorName}`,
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: "#2563eb",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
        } else {
          doctorMarkerRef.current.setPosition(doctorLatLng);
        }
      }

      // Connect Polyline
      if (patientLatLng && doctorLatLng) {
        if (!polylineRef.current) {
          polylineRef.current = new window.google.maps.Polyline({
            path: [doctorLatLng, patientLatLng],
            geodesic: true,
            strokeColor: "#2563eb",
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map,
          });
        } else {
          polylineRef.current.setPath([doctorLatLng, patientLatLng]);
        }

        map.fitBounds(bounds);
      }
    } catch (err) {
      console.warn("[GoogleTrackingMap] Map render error:", err);
      setLoadError(true);
    }
  }, [mapLoaded, patientLatLng, doctorLatLng, doctorName, loadError]);

  // Graceful Fallback SVG Map Container when API key missing/unloaded
  if (loadError || !apiKey) {
    return (
      <div className="relative min-h-[380px] rounded-3xl bg-slate-950 text-white border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between p-6">
        {/* Top Badges */}
        <div className="flex items-center justify-between z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur border border-slate-800 text-xs font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live Telemetry Route
          </div>

          {distanceKm !== null && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold shadow-md">
              <Navigation size={13} />
              {distanceKm} km distance
            </div>
          )}
        </div>

        {/* Fallback SVG Telemetry Canvas */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25">
          <svg className="w-full h-full" viewBox="0 0 600 400" fill="none" stroke="currentColor">
            <path
              d="M 100 300 Q 250 150 500 100"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeDasharray="8 8"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Live Route Graphic Pins */}
        <div className="relative z-10 flex items-center justify-around my-auto px-6">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-xl border-2 border-blue-400 animate-pulse">
              <Radio size={28} />
            </div>
            <span className="mt-2 text-xs font-semibold bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700">
              Dr. {doctorName.split(" ")[0]}
            </span>
          </div>

          <div className="flex-1 mx-4 text-center">
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-emerald-400 to-red-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-full text-[10px] text-slate-300 font-mono">
                {etaMinutes ? `${etaMinutes} min ETA` : "Route Telemetry Active"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-3xl bg-red-500 text-white flex items-center justify-center shadow-xl border-2 border-red-300">
              <MapPin size={28} />
            </div>
            <span className="mt-2 text-xs font-semibold bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-slate-700">
              Patient Location
            </span>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="relative z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0" />
            <span>CareSprint Live Route Monitor</span>
          </div>
          {etaMinutes && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Clock size={13} />
              Estimated Arrival: {etaMinutes} min
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-lg min-h-[380px] w-full">
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

export default GoogleTrackingMap;
