import * as XLSX from 'xlsx';

const GENDER_LABEL = { male: '남성', female: '여성' };

export function exportSeekersToExcel(seekers, filename = 'findmyone_Seeker목록') {
  const rows = seekers.map((s) => ({
    이름: s.name,
    성별: GENDER_LABEL[s.gender] || s.gender,
    생년월일: s.birthDate || '',
    연락처: s.phone || '',
    이메일: s.email || '',
    거주지역: s.location || '',
    '키(cm)': s.height || '',
    직업: s.occupation || '',
    회사: s.company || '',
    학력: s.education || '',
    종교: s.religion || '',
    MBTI: s.mbti || '',
    취미: s.hobbies || '',
    자기소개: s.introduction || '',
    이상형: s.idealType || '',
    상태: s.approval || '',
    등록일: s.createdAt || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 8 },  // 이름
    { wch: 6 },  // 성별
    { wch: 12 }, // 생년월일
    { wch: 14 }, // 연락처
    { wch: 20 }, // 이메일
    { wch: 10 }, // 거주지역
    { wch: 8 },  // 키
    { wch: 16 }, // 직업
    { wch: 14 }, // 회사
    { wch: 12 }, // 학력
    { wch: 8 },  // 종교
    { wch: 6 },  // MBTI
    { wch: 20 }, // 취미
    { wch: 40 }, // 자기소개
    { wch: 30 }, // 이상형
    { wch: 8 },  // 상태
    { wch: 12 }, // 등록일
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Seekers');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
