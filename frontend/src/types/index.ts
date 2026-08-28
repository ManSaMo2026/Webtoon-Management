export type Genre = "판타지" | "로맨스" | "액션" | "스릴러" | "일상" | "SF" | "공포" | "스포츠" | "기타";
export type Cadence = "주 1회" | "주 2회" | "격주" | "월 1회";
export type ColorMode = "흑백" | "컬러" | "한정컬러";
export type BgComplexity = "단순" | "보통" | "복잡";
export type ForeshadowStatus = "미회수" | "회수완료" | "진행중";
export type ForeshadowImportance = "low" | "medium" | "high";
export type EpisodePurpose = "설정" | "전개" | "클라이맥스" | "반전" | "여운";
export type RiskLevel = "낮음" | "보통" | "높음" | "위험";

export interface Project {
  id: string;
  title: string;
  genre: Genre;
  totalEpisodes: number;
  cadence: Cadence;
  weeklyHours: number;
  avgCuts: number;
  colorMode: ColorMode;
  bgComplexity: BgComplexity;
  hasAssistant: boolean;
  logline: string;
  conflict: string;
  currentEpisode: number;
  nextDeadline: string; // ISO date string
  successRate: number; // 0-100
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: string;
  projectId: string;
  number: number;
  summary: string;
  purpose: EpisodePurpose;
  hook: string;
}

export interface Foreshadow {
  id: string;
  projectId: string;
  content: string;
  appearEp: number;
  resolveEp: number | null;
  status: ForeshadowStatus;
  keyword?: string;
  importance?: ForeshadowImportance;
  relatedCharacterIds?: string[];
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  personality: string;
  goal: string;
  speechStyle: string;
  taboo: string;
  secret: string;
  keywords: string[];
  imageUrl?: string;
  gender?: string;
  age?: string;
  origin?: string;
  occupation?: string;
  likes?: string;
  dislikes?: string;
  backstory?: string;
  relationships?: string;
}

export interface WorldSetting {
  id: string;
  projectId: string;
  era: string;
  mainPlaces: string;
  worldRules: string;
  organizations: string;
  culture: string;
  technologyOrMagic: string;
  moodTone: string;
  forbiddenSettings: string;
}

export interface SceneRequest {
  projectId: string;
  episodeNumber: number;
  purpose: string;
  emotionKeywords: string[];
  characters: string[];
  location: string;
  timeOfDay: string;
  tone: string;
}

export interface Cut {
  number: number;
  description: string;
  viewpoint: string;
  emotion: string;
}

export interface SceneResult {
  cuts: Cut[];
  viewpointRecommendation: string;
  emotionPoint: string;
  endingHooks: string[];
}

export interface ScheduleInput {
  cuts: number;
  colorMode: ColorMode;
  bgComplexity: BgComplexity;
  hasAssistant: boolean;
  weeklyHours: number;
  deadlineDays: number;
}

export interface RiskFactor {
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

export interface ScheduleResult {
  successRate: number;
  estimatedDays: number;
  requiredHours: number;
  availableHours: number;
  hourGap: number;
  riskFactors: RiskFactor[];
  recommendation: string;
}

export interface Act {
  projectId: string;
  act1: string;
  act2: string;
  act3: string;
}

export interface Todo {
  id: string;
  projectId: string;
  content: string;
  done: boolean;
}
