import { SearchSunLongitude, SearchMoonPhase, MakeTime } from 'astronomy-engine';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 특정 연도의 입춘(황경 315도) 시각을 구합니다.
 */
export function getIpchunTime(year: number): Date {
  // 입춘은 2월 3~5일경이므로 2월 2일(KST 00:00)부터 탐색 시작
  const startDt = new Date(Date.UTC(year, 1, 2, -9, 0, 0)); 
  const time = SearchSunLongitude(315, MakeTime(startDt), 10);
  if (!time) throw new Error(`입춘을 찾지 못했습니다: year=${year}`);
  return time.date;
}

/**
 * 특정 연도의 해당 황경(태양의 위치) 교입 시각을 구합니다.
 */
export function getMonthSolarTerm(year: number, targetLon: number): Date {
  const monthMap: Record<number, number> = {
    0: 3, 15: 4, 30: 4, 45: 5, 60: 5, 75: 6, 90: 6, 105: 7, 120: 7,
    135: 8, 150: 8, 165: 9, 180: 9, 195: 10, 210: 10, 225: 11, 240: 11,
    255: 12, 270: 12, 285: 1, 300: 1, 315: 2, 330: 2, 345: 3
  };
  const m = monthMap[targetLon];
  const isMid = targetLon % 30 === 0;
  const d = isMid ? 21 : 5;
  
  // 10일 전부터 탐색
  const roughDt = new Date(Date.UTC(year, m - 1, d, -9, 0, 0)); 
  const startDt = new Date(roughDt.getTime() - 10 * 24 * 60 * 60 * 1000);
  
  const time = SearchSunLongitude(targetLon, MakeTime(startDt), 20);
  if (!time) throw new Error(`황경 교입 시각을 찾지 못했습니다: year=${year}`);
  return time.date;
}

/**
 * 음력(윤달 포함)을 양력으로 변환합니다.
 */
export function convertLunarToSolar(y: number, m: number, d: number, isLeap: boolean): Date | null {
  const wsLon = 270; // 동지
  const wsDt = getMonthSolarTerm(y - 1, wsLon);
  const nextWsDt = getMonthSolarTerm(y, wsLon);
  
  const newMoons: Date[] = [];
  const startMoonSearch = new Date(wsDt.getTime() - 30 * 24 * 60 * 60 * 1000);
  let cursor = MakeTime(startMoonSearch);
  
  // 동지 이전부터 다음 동지 이후까지의 합삭(New Moon) 리스트 추출
  while (true) {
    const nmTime = SearchMoonPhase(0, cursor, 40);
    if (!nmTime) throw new Error(`nmTime을 찾지 못했습니다: year=${y}`);
    const nmDt = nmTime.date;
    if (nmDt > new Date(nextWsDt.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      break;
    }
    // 합삭일의 KST 기준 00:00:00 처리
    const kst = new Date(nmDt.getTime() + KST_OFFSET_MS);
    kst.setUTCHours(0, 0, 0, 0);
    newMoons.push(new Date(kst.getTime() - KST_OFFSET_MS));
    cursor = MakeTime(new Date(nmDt.getTime() + 25 * 24 * 60 * 60 * 1000));
  }
  
  // 동지일의 KST 기준 00:00:00
  const wsDay = new Date(wsDt.getTime() + KST_OFFSET_MS);
  wsDay.setUTCHours(0, 0, 0, 0);
  const wsDayUtc = new Date(wsDay.getTime() - KST_OFFSET_MS);
  
  let month11Idx = -1;
  for (let i = 0; i < newMoons.length - 1; i++) {
    if (newMoons[i] <= wsDayUtc && wsDayUtc < newMoons[i+1]) {
      month11Idx = i;
      break;
    }
  }
  if (month11Idx === -1) return null;
  
  const nextWsDay = new Date(nextWsDt.getTime() + KST_OFFSET_MS);
  nextWsDay.setUTCHours(0, 0, 0, 0);
  const nextWsDayUtc = new Date(nextWsDay.getTime() - KST_OFFSET_MS);
  
  let nextMonth11Idx = -1;
  for (let i = 0; i < newMoons.length - 1; i++) {
    if (newMoons[i] <= nextWsDayUtc && nextWsDayUtc < newMoons[i+1]) {
      nextMonth11Idx = i;
      break;
    }
  }
  
  const hasLeap = (nextMonth11Idx - month11Idx) === 13;
  
  // 12중기 (음력 달의 기준)
  const lons = [270, 300, 330, 0, 30, 60, 90, 120, 150, 180, 210, 240];
  const mNums = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  const termsDt: { dt: Date, mNum: number }[] = [];
  for (let i = 0; i < lons.length; i++) {
    const lon = lons[i];
    const calcY = lon >= 270 ? y - 1 : y;
    
    // 중기일의 KST 기준 00:00:00
    const termDt = getMonthSolarTerm(calcY, lon);
    const kstTerm = new Date(termDt.getTime() + KST_OFFSET_MS);
    kstTerm.setUTCHours(0, 0, 0, 0);
    termsDt.push({ dt: new Date(kstTerm.getTime() - KST_OFFSET_MS), mNum: mNums[i] });
    
    // 내년 봄/여름 중기도 커버하기 위해 추가
    if (lon < 270) {
      const termDt2 = getMonthSolarTerm(y + 1, lon);
      const kstTerm2 = new Date(termDt2.getTime() + KST_OFFSET_MS);
      kstTerm2.setUTCHours(0, 0, 0, 0);
      termsDt.push({ dt: new Date(kstTerm2.getTime() - KST_OFFSET_MS), mNum: mNums[i] });
    }
  }
  
  termsDt.sort((a, b) => a.dt.getTime() - b.dt.getTime());
  
  const lunarCalendar: { m: number, leap: boolean, startD: Date }[] = [];
  let currentMonthNum = 11;
  let leapAssigned = false;
  
  for (let i = month11Idx; i <= nextMonth11Idx; i++) {
    const startD = newMoons[i];
    const endD = (i + 1 < newMoons.length) ? newMoons[i+1] : new Date(startD.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const termsInMonth = termsDt.filter(t => startD <= t.dt && t.dt < endD);
    
    // 윤달 판별 (중기가 없는 달)
    if (hasLeap && !leapAssigned && termsInMonth.length === 0) {
      lunarCalendar.push({ m: currentMonthNum > 1 ? currentMonthNum - 1 : 12, leap: true, startD });
      leapAssigned = true;
    } else {
      lunarCalendar.push({ m: currentMonthNum, leap: false, startD });
      currentMonthNum = currentMonthNum < 12 ? currentMonthNum + 1 : 1;
    }
  }
  
  let targetStartDate: Date | null = null;
  for (const cal of lunarCalendar) {
    if (cal.m === m && cal.leap === isLeap) {
      const startYear = new Date(cal.startD.getTime() + KST_OFFSET_MS).getUTCFullYear();
      if ([y, y - 1, y + 1].includes(startYear)) {
        targetStartDate = cal.startD;
        break;
      }
    }
  }
  
  if (!targetStartDate) return null;
  
  // 지정된 일(d)을 더함
  const targetKst = new Date(targetStartDate.getTime() + KST_OFFSET_MS);
  targetKst.setUTCDate(targetKst.getUTCDate() + (d - 1));
  return new Date(targetKst.getTime() - KST_OFFSET_MS);
}
