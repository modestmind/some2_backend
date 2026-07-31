export type HeavenlyStem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
export type EarthlyBranch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";

export interface Pillar {
  heavenlyStem: HeavenlyStem;
  earthlyBranch: EarthlyBranch;
}

export type Gender = "남" | "여";

export interface PersonInfo {
  name: string;
  gender: Gender;
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;
}

export interface GenerateReportParams {
  client: PersonInfo;
  partner: PersonInfo;
  relationship: string;
  currentSituation: string;
  reportFormat: string;
}

export interface IOpenAIReportUtil {
  generateReport: (params: GenerateReportParams) => Promise<string>;
}
