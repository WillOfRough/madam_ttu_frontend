import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, X, ImagePlus } from 'lucide-react';
import styles from './PhotoUploader.module.css';

export default function PhotoUploader({ photos, onAdd, onRemove, min = 3, max = 6 }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const previews = acceptedFiles.map((file) =>
        Object.assign(file, { preview: URL.createObjectURL(file) })
      );
      onAdd(previews);
    },
    [onAdd]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: max - photos.length,
    disabled: photos.length >= max,
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid}>
        {photos.map((photo, idx) => (
          <div key={idx} className={styles.photoCard}>
            <img
              src={photo.preview || photo}
              alt={`사진 ${idx + 1}`}
              className={styles.photo}
            />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => onRemove(idx)}
            >
              <X size={14} />
            </button>
            {idx === 0 && <span className={styles.mainBadge}>대표</span>}
          </div>
        ))}

        {photos.length < max && (
          <div
            {...getRootProps()}
            className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
          >
            <input {...getInputProps()} />
            <ImagePlus size={28} className={styles.dropIcon} />
            <span className={styles.dropText}>
              {isDragActive ? '여기에 놓으세요' : '사진 추가'}
            </span>
          </div>
        )}
      </div>

      <p className={styles.hint}>
        <Camera size={14} />
        최소 {min}장, 최대 {max}장 ({photos.length}/{max})
      </p>
    </div>
  );
}
