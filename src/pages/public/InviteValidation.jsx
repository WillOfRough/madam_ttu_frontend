import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as inviteService from '../../api/inviteService';
import styles from './InviteValidation.module.css';

export default function InviteValidation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | valid | invalid

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    inviteService.validateToken(token)
      .then((res) => {
        if (res?.valid || res?.status === 'active') {
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  useEffect(() => {
    if (status === 'valid') {
      navigate(`/apply/oath/${token}`, { replace: true });
    } else if (status === 'invalid') {
      navigate('/expired', { replace: true });
    }
  }, [status, token, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.spinner} />
      <p className={styles.text}>초대 링크를 확인하고 있습니다...</p>
    </div>
  );
}
