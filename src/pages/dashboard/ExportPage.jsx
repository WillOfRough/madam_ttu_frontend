import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as clientService from '../../api/clientService';
import * as exportService from '../../api/exportService';
import { exportClientsToExcel } from '../../utils/exportExcel';
import { toast } from '../../store/toastStore';
import styles from './ExportPage.module.css';

export default function ExportPage() {
  const [logs, setLogs] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    exportService.getExportLogs()
      .then(setLogs)
      .catch((err) => {
        toast.error(err.message || '내보내기 이력을 불러오지 못했습니다.');
      });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await clientService.listClients({
        owner: 'all',
        approval: 'approved',
        limit: 1000,
        page: 1,
      });
      const clientList = result.data || result.clients || result;
      exportClientsToExcel(clientList);
      toast.success(`${clientList.length}건의 Client 데이터를 내보냈습니다.`);
    } catch (err) {
      toast.error(err.message || '내보내기에 실패했습니다.');
    }
    setExporting(false);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>내보내기</h1>

      <div className={styles.exportCard}>
        <FileSpreadsheet size={32} className={styles.exportIcon} />
        <div className={styles.exportInfo}>
          <h3>승인된 Client 엑셀 다운로드</h3>
          <p>승인된 모든 Client의 프로필을 엑셀 파일로 내보냅니다.</p>
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
                <span className={styles.logType}>{log.exportType || 'Excel'}</span>
                <span className={styles.logCount}>{log.recordCount ?? '-'}건</span>
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
