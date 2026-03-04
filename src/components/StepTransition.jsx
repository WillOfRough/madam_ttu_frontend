import { useEffect, useState } from 'react';
import styles from './StepTransition.module.css';

export default function StepTransition({ children, stepKey }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [stepKey]);

  return (
    <div className={`${styles.container} ${visible ? styles.visible : ''}`}>
      {children}
    </div>
  );
}
