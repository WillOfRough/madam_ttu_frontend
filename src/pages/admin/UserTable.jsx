import { useMemo } from 'react';
import { Search, Download, Eye, Heart, User } from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import mockUsers from '../../data/mockUsers';
import { exportUsersToExcel } from '../../utils/exportExcel';
import styles from './UserTable.module.css';

const GENDER_LABEL = { male: '남성', female: '여성' };
const GENDER_ICON_CLASS = { male: styles.male, female: styles.female };

export default function UserTable() {
  const { genderFilter, searchQuery, setGenderFilter, setSearchQuery, setSelectedUser, setMatchSource } =
    useAdminStore();

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      if (genderFilter !== 'all' && u.gender !== genderFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.nickname.toLowerCase().includes(q) ||
          u.job.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [genderFilter, searchQuery]);

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {['all', 'male', 'female'].map((g) => (
            <button
              key={g}
              className={`${styles.filterBtn} ${genderFilter === g ? styles.active : ''}`}
              onClick={() => setGenderFilter(g)}
            >
              {g === 'all' ? '전체' : GENDER_LABEL[g]}
              <span className={styles.count}>
                {g === 'all'
                  ? mockUsers.length
                  : mockUsers.filter((u) => u.gender === g).length}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="이름, 닉네임, 직업 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className={styles.exportBtn} onClick={() => exportUsersToExcel(filtered)}>
          <Download size={16} />
          엑셀 다운로드
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>성별</th>
              <th>이름</th>
              <th>닉네임</th>
              <th>나이</th>
              <th>직업</th>
              <th>MBTI</th>
              <th>가입일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className={styles.row}>
                <td>
                  <span className={`${styles.genderBadge} ${GENDER_ICON_CLASS[user.gender]}`}>
                    <User size={12} />
                    {GENDER_LABEL[user.gender]}
                  </span>
                </td>
                <td className={styles.nameCell}>{user.name}</td>
                <td>{user.nickname}</td>
                <td>{user.age}세</td>
                <td>{user.job}</td>
                <td><span className={styles.mbti}>{user.mbti}</span></td>
                <td className={styles.dateCell}>{user.createdAt}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => { setSelectedUser(user.id); useAdminStore.getState().clearMatchSource(); }}
                      title="프로필 보기"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className={styles.matchBtn}
                      onClick={() => { setMatchSource(user.id); useAdminStore.getState().clearSelection(); }}
                      title="매칭 시뮬레이션"
                    >
                      <Heart size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className={styles.empty}>검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
