import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2 } from 'lucide-react';
import styles from './PhotoGallery.module.css';

function PhotoThumb({ src, alt, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  if (error) {
    return (
      <div className={styles.photoThumb}>
        <div className={styles.photoError}>불러올 수 없음</div>
      </div>
    );
  }

  return (
    <button
      className={styles.photoThumb}
      onClick={() => onClick(src)}
      type="button"
    >
      {!loaded && <div className={styles.photoSkeleton} />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={loaded ? styles.photoLoaded : styles.photoHidden}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </button>
  );
}

export default function PhotoGallery({
  photoUrls = [],
  maxPhotos = 5,
  canEdit = false,
  onAdd,
  onDelete,
  uploading = false,
  deletingPhotoId = null,
}) {
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const photoInputRef = useRef(null);
  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

  return (
    <>
      {photoUrls.length > 0 ? (
        <div className={styles.photoGallery}>
          {photoUrls.map((url, idx) => {
            const segments = url.split('/');
            const photoId = segments[segments.length - 1];
            return (
              <div key={idx} style={{ position: 'relative' }}>
                <PhotoThumb
                  src={url}
                  alt={`사진 ${idx + 1}`}
                  onClick={(src) => setLightboxUrl(src)}
                />
                {canEdit && onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(url); }}
                    disabled={deletingPhotoId === photoId}
                    className={styles.deleteBtn}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={styles.emptyText}>등록된 사진이 없습니다.</p>
      )}

      {canEdit && onAdd && photoUrls.length < maxPhotos && (
        <div style={{ marginTop: 12 }}>
          <button
            className={styles.addBtn}
            onClick={() => photoInputRef.current?.click()}
            disabled={uploading}
            type="button"
          >
            <Plus size={14} />
            {uploading ? '업로드 중...' : '사진 추가'}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={onAdd}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {lightboxUrl && createPortal(
        <div className={styles.lightbox} onClick={closeLightbox}>
          <img src={lightboxUrl} alt="확대 보기" onClick={(e) => e.stopPropagation()} />
          <button className={styles.lightboxClose} onClick={closeLightbox}>×</button>
        </div>,
        document.body
      )}
    </>
  );
}
