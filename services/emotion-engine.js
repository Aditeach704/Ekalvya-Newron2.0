/** Lightweight tone detection for conversational style, not a mental-health diagnosis. */
const PATTERNS = [
  { emotion: "distressed", words: /\b(overwhelmed|panic|panicking|hopeless|scared|terrified|can't cope|cannot cope|too much|breaking down)\b/i },
  { emotion: "sad", words: /\b(sad|upset|lonely|hurt|grief|miss them|crying|disappointed|down today)\b/i },
  { emotion: "frustrated", words: /\b(angry|annoyed|frustrated|irritated|fed up|this sucks|hate this|stupid|idiot)\b/i },
  { emotion: "anxious", words: /\b(anxious|worried|nervous|stress(ed)?|afraid|uncertain|overthinking)\b/i },
  { emotion: "excited", words: /\b(excited|awesome|amazing|can't wait|cannot wait|let's go|great news|so happy)\b/i },
  { emotion: "happy", words: /\b(happy|glad|proud|thank you|thanks a lot|grateful|love this)\b/i },
];

export function analyzeEmotion(text = "") {
  const value = String(text).slice(0, 20_000);
  const match = PATTERNS.find((pattern) => pattern.words.test(value));
  return { emotion: match?.emotion || "neutral", confidence: match ? "low-to-moderate" : "low" };
}

export function buildEmotionPrompt(text = "") {
  const { emotion } = analyzeEmotion(text);
  const guidance = {
    distressed: "The user may be feeling overwhelmed. Respond calmly, gently, and practically. Validate the feeling without exaggerating or making assumptions; offer one manageable next step.",
    sad: "The user may be sad. Be warm and attentive, acknowledge the feeling briefly, and offer supportive help without forcing positivity.",
    frustrated: "The user may be frustrated. Stay respectful and patient, avoid defensiveness, acknowledge the friction, and focus on a clear solution.",
    anxious: "The user may be worried. Use calm, clear language, avoid alarmism, and break advice into manageable steps.",
    excited: "The user may be excited. Match their positive energy while remaining useful and accurate.",
    happy: "The user may be feeling positive. Be warm and encouraging without overdoing it.",
    neutral: "Use a friendly, natural tone suited to the user's message.",
  };
  return `Conversational tone guidance (estimated, not a diagnosis): ${guidance[emotion]}`;
}
