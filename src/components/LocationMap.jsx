import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './LocationMap.module.css';

function createIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

async function geocode(address) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&countrycodes=kr&limit=1`,
    { headers: { 'Accept-Language': 'ko' } }
  );
  const data = await res.json();
  if (data.length > 0) {
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  }
  return null;
}

export default function LocationMap({ locations }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [status, setStatus] = useState('loading');
  const [failedAddresses, setFailedAddresses] = useState([]);

  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: false,
    }).setView([37.5665, 126.978], 11);

    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    const failed = [];
    let resolved = 0;
    const bounds = L.latLngBounds();
    let hasMarker = false;

    locations.forEach((loc) => {
      geocode(loc.address).then((coords) => {
        resolved++;
        if (coords) {
          hasMarker = true;
          bounds.extend(coords);
          const marker = L.marker(coords, { icon: createIcon(loc.color) }).addTo(map);
          marker.bindPopup(
            `<div style="font-size:13px;line-height:1.4;"><strong>${loc.label}</strong><br/><span style="color:#666">${loc.address}</span></div>`
          );
        } else {
          failed.push(loc.label);
        }

        if (resolved === locations.length) {
          if (hasMarker) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            setStatus('ready');
          } else {
            setStatus('error');
          }
          setFailedAddresses(failed);
        }
      });
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [locations]);

  return (
    <div className={styles.mapContainer}>
      {status === 'loading' && (
        <div className={styles.loadingOverlay}>지도를 불러오는 중...</div>
      )}
      {status === 'error' && (
        <div className={styles.loadingOverlay}>주소를 지도에 표시할 수 없습니다</div>
      )}
      <div ref={mapRef} className={styles.mapElement} />
      {status === 'ready' && (
        <div className={styles.legend}>
          {locations.map((loc, i) => (
            <div key={i} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: loc.color }} />
              <span className={styles.legendLabel}>
                {loc.label}
                {failedAddresses.includes(loc.label) && <span className={styles.legendFailed}> (표시 불가)</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
