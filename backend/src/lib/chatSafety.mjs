import { AppError } from "./errors.mjs";

export const CHAT_SAFETY_CODES = Object.freeze({
  SECURITY: "CHAT_SECURITY_BLOCKED",
  LANGUAGE: "CHAT_LANGUAGE_BLOCKED",
});

const SECURITY_WARNING = "보안 또는 개인정보를 침해할 수 있는 요청이 감지되어 메시지를 삭제했습니다. 작품 상담과 관련된 내용으로 다시 입력해주세요.";
const LANGUAGE_WARNING = "부적절하거나 공격적인 표현이 감지되어 메시지를 삭제했습니다. 표현을 바꾸어 다시 입력해주세요.";

const OVERRIDE_PATTERNS = [
  /(?:이전|기존|앞선|위의|지금까지|모든).{0,24}(?:지시|명령|규칙|프롬프트).{0,24}(?:무시|잊|취소|우회|해제|따르지)/u,
  /(?:지시|명령|프롬프트).{0,24}(?:무시|잊|취소|우회|해제|덮어쓰)/u,
  /(?:ignore|disregard|forget|bypass|override).{0,40}(?:previous|prior|above|system|developer|instruction|prompt|rule)/iu,
  /(?:previous|prior|above|system|developer).{0,40}(?:ignore|disregard|forget|bypass|override)/iu,
];

const SYSTEM_TARGET_PATTERN = /(?:시스템\s*(?:프롬프트|지시|명령|규칙)|개발자\s*(?:메시지|지시|명령)|system\s*(?:prompt|message|instruction)|developer\s*(?:message|instruction))/iu;
const SENSITIVE_PATTERN = /(?:개인\s*정보|민감\s*정보|보안\s*(?:정보|자료)|비밀\s*(?:정보|키)|api\s*[-_ ]?key|access\s*[-_ ]?token|secret|password|비밀번호|인증\s*정보|토큰|database[_\s-]?url|direct[_\s-]?url|환경\s*변수|\.env)/iu;
const DISCLOSURE_PATTERN = /(?:메일|이메일|전송|보내|전달|업로드|외부|유출|공개|노출|출력|복사|알려|보여|열람|send|email|forward|upload|export|exfiltrat|reveal|show|print|copy)/iu;

// Keep this list intentionally narrow. The service supports fictional conflict,
// so broad violence/sexuality keywords would incorrectly block normal writing.
const KOREAN_ABUSIVE_TERMS = [
  "씨발",
  "시발",
  "ㅅㅂ",
  "병신",
  "ㅂㅅ",
  "개새끼",
  "개색끼",
  "새끼야",
  "좆",
  "존나",
  "지랄",
  "꺼져",
];

const ENGLISH_ABUSIVE_PATTERN = /\b(?:fuck(?:er|ing)?|shit(?:ty)?|bitch|asshole)\b/iu;

function containsAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

function normalizedForms(value) {
  const canonical = String(value ?? "").normalize("NFKC").toLowerCase();
  const compact = canonical.replace(/[\s\p{P}\p{S}_]+/gu, "");
  return { canonical, compact };
}

export function classifyChatInput(value) {
  const { canonical, compact } = normalizedForms(value);
  const compactOverride = containsAny(compact, ["무시", "우회", "해제", "따르지", "ignore", "bypass", "override"]);
  const compactInstructionTarget = containsAny(compact, ["지시", "명령", "규칙", "프롬프트", "systemprompt", "instruction"]);
  const hasOverrideAttempt = OVERRIDE_PATTERNS.some((pattern) => pattern.test(canonical))
    || (compactOverride && compactInstructionTarget);
  const targetsSystemInstructions = SYSTEM_TARGET_PATTERN.test(canonical)
    || containsAny(compact, ["시스템프롬프트", "개발자메시지", "systemprompt", "developerinstruction"]);
  const requestsSensitiveData = SENSITIVE_PATTERN.test(canonical)
    || containsAny(compact, ["개인정보", "민감정보", "보안정보", "apikey", "accesstoken", "비밀번호", "databaseurl", "directurl", ".env"]);
  const requestsDisclosure = DISCLOSURE_PATTERN.test(canonical)
    || containsAny(compact, ["메일", "이메일", "전송", "보내", "유출", "공개", "노출", "upload", "export", "reveal"]);

  if (
    (hasOverrideAttempt && (targetsSystemInstructions || requestsSensitiveData || requestsDisclosure))
    || (targetsSystemInstructions && requestsDisclosure)
    || (requestsSensitiveData && requestsDisclosure)
  ) {
    return { allowed: false, code: CHAT_SAFETY_CODES.SECURITY, message: SECURITY_WARNING };
  }

  if (
    KOREAN_ABUSIVE_TERMS.some((term) => compact.includes(term.normalize("NFKC").toLowerCase()))
    || ENGLISH_ABUSIVE_PATTERN.test(canonical)
  ) {
    return { allowed: false, code: CHAT_SAFETY_CODES.LANGUAGE, message: LANGUAGE_WARNING };
  }

  return { allowed: true };
}

export function enforceChatInputSafety(value) {
  const result = classifyChatInput(value);
  if (!result.allowed) throw new AppError(result.message, 422, result.code);
}
