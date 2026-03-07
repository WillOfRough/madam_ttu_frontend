import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as seekerService from '../../api/seekerService';
import * as exportService from '../../api/exportService';
import { exportSeekersToExcel } from '../../utils/exportExcel';
import styles from './ExportPage.module.css';

export default function ExportPage() {
  const [logs, setLogs] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    exportService.getExportLogs()
      .then(setLogs)
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await seekerService.listSeekers({
        owner: 'all',
        approval: 'approved',
        limit: 1000,
        page: 1,
      });
      const seekers = result.data || result.seekers || result;
      exportSeekersToExcel(seekers);
    } catch { /* ignore */ }
    setExporting(false);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>내보내기</h1>

      <div className={styles.exportCard}>
        <FileSpreadsheet size={32} className={styles.exportIcon} />
        <div className={styles.exportInfo}>
          <h3>승인된 Seeker 엑셀 다운로드</h3>
          <p>승인된 모든 Seeker의 프로필을 엑셀 파일로 내보냅니다.</p>
        </div>
        <button
          className={styles.exportBtn}
          onClick={handleExport}
          disabled={exporting}
        >
          <Download size={16} />
          {exporting ? '내보내는 중...' : '다운로드'}
        </button>
      </div>

      {Array.isArray(logs) && logs.length > 0 && (
        <section className={styles.logsSection}>
          <h2 className={styles.logsTitle}>내보내기 이력</h2>
          <div className={styles.logsList}>
            {logs.map((log, i) => (
              <div key={log.id || i} className={styles.logItem}>
                <span className={styles.logType}>{log.type || 'Excel'}</span>
                <span className={styles.logCount}>{log.count ?? '-'}건</span>
                <span className={styles.logDate}>
                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString('ko-KR') : '-'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
