import { convertLunarToSolar, getIpchunTime, getMonthSolarTerm } from './astro.util.js';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
// 1900-01-01 KST 00:00:00 기준일
const BASE_DATE = new Date(Date.UTC(1900, 0, 1, -9, 0, 0));
const BASE_STEM = 0; // 甲
const BASE_BRANCH = 10; // 戌

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export interface ManseInput {
  gender: 'M' | 'F';
  calendar: 'solar' | 'lunar' | 'lunar_leap';
  year: number;
  month: number;
  day: number;
  time?: { hour: number; minute: number };
}

export interface SajuPillar {
  stem: string;   // 천간 한자 (甲~癸)
  branch: string; // 지지 한자 (子~亥)
}

export interface ManseOutput {
  yearPillar: SajuPillar;
  monthPillar: SajuPillar;
  dayPillar: SajuPillar;
  hourPillar: SajuPillar | null;
}

export const createManseService = () => {
  const calculateSaju = (input: ManseInput): ManseOutput => {
    let dt: Date;
    let timeUnknown = !input.time;
    let hour = input.time?.hour || 0;
    let minute = input.time?.minute || 0;

    if (input.calendar === 'lunar' || input.calendar === 'lunar_leap') {
      const isLeap = input.calendar === 'lunar_leap';
      const solarDate = convertLunarToSolar(input.year, input.month, input.day, isLeap);
      if (!solarDate) {
        throw new Error("유효하지 않은 날짜이거나 음력 변환에 실패했습니다.");
      }
      dt = new Date(solarDate.getTime() + hour * 3600000 + minute * 60000);
    } else {
      dt = new Date(Date.UTC(input.year, input.month - 1, input.day, hour - 9, minute, 0));
    }

    // 일주 계산을 위해 KST 기준 자정(00:00) 날짜 객체 도출
    const targetDateKst = new Date(dt.getTime() + KST_OFFSET_MS);
    targetDateKst.setUTCHours(0, 0, 0, 0);
    const targetDateUtc = new Date(targetDateKst.getTime() - KST_OFFSET_MS);

    let isNightJasi = false;
    if (!timeUnknown && hour === 23 && minute >= 30) {
      isNightJasi = true;
    }

    const deltaDays = Math.round((targetDateUtc.getTime() - BASE_DATE.getTime()) / (24 * 60 * 60 * 1000));
    let dayStemIdx = (BASE_STEM + deltaDays) % 10;
    if (dayStemIdx < 0) dayStemIdx += 10;
    let dayBranchIdx = (BASE_BRANCH + deltaDays) % 12;
    if (dayBranchIdx < 0) dayBranchIdx += 12;

    const y = targetDateKst.getUTCFullYear();
    const ipchunDt = getIpchunTime(y);

    let sajuYear = y;
    if (dt < ipchunDt) {
      sajuYear = y - 1;
    }

    let yearStemIdx = (sajuYear - 4) % 10;
    if (yearStemIdx < 0) yearStemIdx += 10;
    let yearBranchIdx = (sajuYear - 4) % 12;
    if (yearBranchIdx < 0) yearBranchIdx += 12;

    const monthLons = [
      { lon: 315, idx: 0 }, { lon: 345, idx: 1 }, { lon: 15, idx: 2 }, { lon: 45, idx: 3 },
      { lon: 75, idx: 4 }, { lon: 105, idx: 5 }, { lon: 135, idx: 6 }, { lon: 165, idx: 7 },
      { lon: 195, idx: 8 }, { lon: 225, idx: 9 }, { lon: 255, idx: 10 }, { lon: 285, idx: 11 }
    ];

    const monthBounds: Date[] = [];
    for (let i = 0; i < 13; i++) {
      const idx = i % 12;
      const targetLon = monthLons[idx].lon;
      let calcYear = sajuYear;
      if (i === 11) calcYear = sajuYear + 1;
      else if (i === 12) calcYear = sajuYear + 1;

      const termDt = getMonthSolarTerm(calcYear, targetLon);
      monthBounds.push(termDt);
    }

    let sajuMonthIdx = 0;
    for (let i = 0; i < 12; i++) {
      if (dt >= monthBounds[i] && dt < monthBounds[i+1]) {
        sajuMonthIdx = i;
        break;
      } else if (dt >= monthBounds[12] && i === 11) {
        sajuMonthIdx = 11;
      }
    }

    const monthStemStarts = [2, 4, 6, 8, 0];
    const monthStemStart = monthStemStarts[yearStemIdx % 5];
    const monthStemIdx = (monthStemStart + sajuMonthIdx) % 10;
    const monthBranchIdx = (2 + sajuMonthIdx) % 12;

    let hourPillar: SajuPillar | null = null;
    if (!timeUnknown) {
      const timeBranchIdx = Math.floor((hour * 60 + minute + 30) / 120) % 12;
      let refDayStemIdx = dayStemIdx;
      if (isNightJasi) {
        refDayStemIdx = (dayStemIdx + 1) % 10;
      }
      const timeStemStarts = [0, 2, 4, 6, 8];
      const timeStemStart = timeStemStarts[refDayStemIdx % 5];
      const timeStemIdx = (timeStemStart + timeBranchIdx) % 10;
      hourPillar = { stem: STEMS_HANJA[timeStemIdx], branch: BRANCHES_HANJA[timeBranchIdx] };
    }

    const makePillar = (sIdx: number, bIdx: number): SajuPillar => ({
      stem: STEMS_HANJA[sIdx],
      branch: BRANCHES_HANJA[bIdx],
    });

    return {
      yearPillar: makePillar(yearStemIdx, yearBranchIdx),
      monthPillar: makePillar(monthStemIdx, monthBranchIdx),
      dayPillar: makePillar(dayStemIdx, dayBranchIdx),
      hourPillar,
    };
  };

  return { calculateSaju };
};
