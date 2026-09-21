// Mirrors the string union types in frontend/src/types/index.ts.
// Kept as plain strings in the DB (see prisma/schema.prisma) and enforced here instead.
export const GENRES = ["판타지", "로맨스", "액션", "스릴러", "일상", "SF", "공포", "스포츠", "기타"];
export const CADENCES = ["주 1회", "주 2회", "격주", "월 1회"];
export const COLOR_MODES = ["흑백", "컬러", "한정컬러"];
export const BG_COMPLEXITIES = ["단순", "보통", "복잡"];
export const FORESHADOW_STATUSES = ["미회수", "회수완료", "진행중"];
export const FORESHADOW_IMPORTANCES = ["low", "medium", "high"];
export const EPISODE_PURPOSES = ["설정", "전개", "클라이맥스", "반전", "여운"];
export const RISK_LEVELS = ["낮음", "보통", "높음", "위험"];
export const PROJECT_STATUSES = ["기획중", "연재중", "휴재중", "완결", "기타"];
export const CHARACTER_ROLE_GROUPS = ["주연", "조연", "기타"];
