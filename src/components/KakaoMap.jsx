import { useEffect, useRef, useState } from 'react';
import styles from './KakaoMap.module.css';

function createMarkerSvg(color, label) {
  const char = label.charAt(0);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}"/>
    <circle cx="14" cy="14" r="9" fill="white"/>
    <text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">${char}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function KakaoMap({ locations }) {
  const mapRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      setStatus('error');
      return;
    }

    window.kakao.maps.load(() => {
      const container = mapRef.current;
      if (!container) return;

      const map = new window.kakao.maps.Map(container, {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 7,
      });

      const geocoder = new window.kakao.maps.services.Geocoder();
      const bounds = new window.kakao.maps.LatLngBounds();
      let resolved = 0;
      let successCount = 0;
      let activeInfoWindow = null;

      locations.forEach((loc) => {
        geocoder.addressSearch(loc.address, (result, geocodeStatus) => {
          resolved++;

          if (geocodeStatus === window.kakao.maps.services.Status.OK) {
            successCount++;
            const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
            bounds.extend(coords);

            const markerImage = new window.kakao.maps.MarkerImage(
              createMarkerSvg(loc.color, loc.label),
              new window.kakao.maps.Size(28, 40),
              { offset: new window.kakao.maps.Point(14, 40) }
            );

            const marker = new window.kakao.maps.Marker({
              map,
              position: coords,
              image: markerImage,
              title: loc.label,
            });

            const infoContent = `<div style="padding:8px 12px;font-size:13px;line-height:1.4;white-space:nowrap;">
              <strong>${loc.label}</strong><br/>
              <span style="color:#666">${loc.address}</span>
            </div>`;

            const infoWindow = new window.kakao.maps.InfoWindow({
              content: infoContent,
            });

            window.kakao.maps.event.addListener(marker, 'click', () => {
              if (activeInfoWindow) activeInfoWindow.close();
              infoWindow.open(map, marker);
              activeInfoWindow = infoWindow;
            });
          }

          if (resolved === locations.length) {
            if (successCount > 0) {
              map.relayout();
              map.setBounds(bounds, 80, 80, 80, 80);
              setStatus('ready');
            } else {
              setStatus('error');
            }
          }
        });
      });
    });
  }, [locations]);

  if (!window.kakao || !window.kakao.maps) {
    return null;
  }

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
              <span className={styles.legendLabel}>{loc.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
