import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import useToastStore from '../store/toastStore';
import styles from './Toast.module.css';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <Icon size={18} className={styles.icon} />
            <span className={styles.message}>{t.message}</span>
            <button className={styles.close} onClick={() => removeToast(t.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
