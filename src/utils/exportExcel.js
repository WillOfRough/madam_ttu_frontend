import * as XLSX from 'xlsx';

const GENDER_LABEL = { male: '남성', female: '여성' };

export function exportClientsToExcel(clients, filename = 'findmyone_Seeker목록') {
  const rows = clients.map((c) => ({
    이름: c.name,
    성별: GENDER_LABEL[c.gender] || c.gender,
    생년월일: c.birthDate || '',
    연락처: c.phone || '',
    이메일: c.email || '',
    거주지역: c.location || '',
    '키(cm)': c.height || '',
    직업: c.occupation || '',
    회사: c.company || '',
    학력: c.education || '',
    종교: c.religion || '',
    MBTI: c.mbti || '',
    취미: c.hobbies || '',
    자기소개: c.introduction || '',
    이상형: c.idealType || '',
    상태: c.approvalStatus || '',
    등록일: c.createdAt || '',
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
