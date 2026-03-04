import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import mockUsers from '../data/mockUsers';

// Mock XLSX.writeFile so it doesn't actually write to disk
vi.mock('xlsx', async () => {
  const actual = await vi.importActual('xlsx');
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

import { exportUsersToExcel } from '../utils/exportExcel';

describe('Excel Export - 엑셀 내보내기', () => {
  it('전체 회원 내보내기 호출 시 writeFile이 호출되는지 확인', () => {
    exportUsersToExcel(mockUsers);
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('올바른 파일명으로 내보내기', () => {
    exportUsersToExcel(mockUsers, '테스트_목록');
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      '테스트_목록.xlsx'
    );
  });

  it('기본 파일명이 마담MJ_회원목록인지 확인', () => {
    exportUsersToExcel(mockUsers);
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      '마담MJ_회원목록.xlsx'
    );
  });

  it('빈 배열도 에러 없이 처리', () => {
    expect(() => exportUsersToExcel([])).not.toThrow();
  });

  it('일부 회원만 내보내기 가능', () => {
    const malesOnly = mockUsers.filter(u => u.gender === 'male');
    expect(() => exportUsersToExcel(malesOnly, '남성_회원')).not.toThrow();
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      '남성_회원.xlsx'
    );
  });
});
