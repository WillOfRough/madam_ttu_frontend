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

function geocodeKakao(geocoder, address) {
  return new Promise((resolve) => {
    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        resolve([parseFloat(result[0].y), parseFloat(result[0].x)]);
      } else {
        // 주소 검색 실패 시 키워드 검색 시도
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(address, (data, psStatus) => {
          if (psStatus === window.kakao.maps.services.Status.OK && data.length > 0) {
            resolve([parseFloat(data[0].y), parseFloat(data[0].x)]);
          } else {
            resolve(null);
          }
        });
      }
    });
  });
}

export default function LocationMap({ locations }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [status, setStatus] = useState('loading');
  const [failedAddresses, setFailedAddresses] = useState([]);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      setStatus('error');
      return;
    }

    window.kakao.maps.load(() => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        keyboard: false,
        attributionControl: false,
      }).setView([37.5665, 126.978], 11);

      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      const geocoder = new window.kakao.maps.services.Geocoder();
      const failed = [];
      let resolved = 0;
      const bounds = L.latLngBounds();
      let hasMarker = false;

      locations.forEach((loc) => {
        geocodeKakao(geocoder, loc.address).then((coords) => {
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
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
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
