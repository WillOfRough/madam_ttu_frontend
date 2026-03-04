import * as XLSX from 'xlsx';

const LABEL_MAP = {
  id: 'ID',
  gender: '성별',
  name: '이름',
  nickname: '닉네임',
  age: '나이',
  height: '키(cm)',
  location: '지역',
  education: '학력',
  job: '직업',
  religion: '종교',
  drinking: '음주',
  smoking: '흡연',
  mbti: 'MBTI',
  personality: '성격 키워드',
  hobbies: '취미',
  intro: '자기소개',
  createdAt: '가입일',
};

const GENDER_LABEL = { male: '남성', female: '여성' };

export function exportUsersToExcel(users, filename = '마담MJ_회원목록') {
  const rows = users.map((user) => ({
    ID: user.id,
    성별: GENDER_LABEL[user.gender] || user.gender,
    이름: user.name,
    닉네임: user.nickname,
    나이: user.age,
    '키(cm)': user.height,
    지역: user.location,
    학력: user.education,
    직업: user.job,
    종교: user.religion,
    음주: user.drinking,
    흡연: user.smoking,
    MBTI: user.mbti,
    '성격 키워드': user.personality?.join(', ') || '',
    취미: user.hobbies?.join(', ') || '',
    자기소개: user.intro,
    가입일: user.createdAt,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 6 },  // ID
    { wch: 6 },  // 성별
    { wch: 8 },  // 이름
    { wch: 14 }, // 닉네임
    { wch: 6 },  // 나이
    { wch: 8 },  // 키
    { wch: 14 }, // 지역
    { wch: 12 }, // 학력
    { wch: 16 }, // 직업
    { wch: 8 },  // 종교
    { wch: 14 }, // 음주
    { wch: 8 },  // 흡연
    { wch: 6 },  // MBTI
    { wch: 30 }, // 성격
    { wch: 24 }, // 취미
    { wch: 40 }, // 자기소개
    { wch: 12 }, // 가입일
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '회원목록');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
