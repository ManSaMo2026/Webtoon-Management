export type Genre = "판타지" | "로맨스" | "액션" | "스릴러" | "일상" | "SF" | "공포" | "스포츠" | "기타";
export type Cadence = "주 1회" | "주 2회" | "격주" | "월 1회";
export type ColorMode = "흑백" | "컬러" | "한정컬러";
export type BgComplexity = "단순" | "보통" | "복잡";
export type ForeshadowStatus = "미회수" | "회수완료" | "진행중";
export type ForeshadowImportance = "low" | "medium" | "high";
export type EpisodePurpose = "설정" | "전개" | "클라이맥스" | "반전" | "여운";
export type RiskLevel = "낮음" | "보통" | "높음" | "위험";
export type ProjectStatus = "기획중" | "연재중" | "휴재중" | "완결" | "기타";

export interface Project {
  id: string;
  title: string;
  coverImageUrl?: string;
  platform?: string;
  tags?: string[];
  genre: Genre;
  customGenre?: string;
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
  completionDate?: string; // ISO date string
  successRate: number; // 0-100
  riskLevel: RiskLevel;
  status?: ProjectStatus;
  customStatus?: string;
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

export type CharacterRoleGroup = "주연" | "조연" | "기타";

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  roleGroup?: CharacterRoleGroup;
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

export interface RelationshipNode {
  characterId: string;
  x: number;
  y: number;
}

export interface RelationshipConnection {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  label: string;
  fromSide?: RelationshipConnectionSide;
  toSide?: RelationshipConnectionSide;
  fromAnchor?: number;
  toAnchor?: number;
  arrowDirection?: RelationshipArrowDirection;
  controlOffsetX?: number;
  controlOffsetY?: number;
}

export type RelationshipConnectionSide = "top" | "right" | "bottom" | "left";
export type RelationshipArrowDirection = "forward" | "reverse" | "both" | "none";

export interface RelationshipNote {
  id: string;
  text: string;
  x: number;
  y: number;
}

export interface RelationshipBoard {
  projectId: string;
  nodes: RelationshipNode[];
  connections: RelationshipConnection[];
  notes: RelationshipNote[];
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
  researchNotes?: string;
  referenceSources?: string;
  placeReferences?: WorldPlaceReference[];
}

export interface WorldPlaceReference {
  id: string;
  imageUrl: string;
  memo: string;
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

export interface TimelineItem {
  id: string;
  projectId: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}
