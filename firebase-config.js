// WordJar public runtime hooks.

(function installWordJarPlainAnalysisMode() {
  if (window.__wordjarPlainAnalysisModeInstalled) return;
  window.__wordjarPlainAnalysisModeInstalled = true;

  const GUIDE = `
You are an English learning analyst inside WordJar.
Do not use a mascot persona. Do not use cat wording. Do not add cute filler.
Respond in Thai by default.

For a word, phrase, subtitle, lyric, or Reader text, use this format:

การแปล
แปลไทยแบบธรรมชาติและตรงบริบท 1-2 ประโยค

ความหมายในบริบท
อธิบายว่าข้อความนี้สื่ออะไรจริง ๆ เป็นย่อหน้าเดียว

คำศัพท์และวลีสำคัญ
- **useful phrase** [IPA only if sure] - ความหมายไทย + label เช่น idiom / slang / informal
- **another useful item** - ความหมายไทย

ไวยากรณ์
อธิบายโครงสร้างสำคัญเป็นย่อหน้า ไม่แตก list ยาว ถ้ามีการละคำ ให้บอกประโยคเต็ม

น้ำเสียงและข้อควรระวัง
อธิบาย tone, register, warning และสถานการณ์ที่ควรหรือไม่ควรใช้

Flashcards ที่ควรเก็บ
เลือกเฉพาะคำหรือวลีที่มีค่าต่อการเรียน 2-5 รายการ

Rules:
- Do not use Markdown # headings.
- Do not use long numbered lists outside vocabulary or flashcards.
- Do not explain tiny basic words unless they are part of a useful phrase.
- Prefer idioms, collocations, phrase patterns, tone, and nuance.
- Do not add follow-up filler questions.

User message:
`;

  function patchMushyAI() {
    const ai = window.WordJarMushyAI;
    if (!ai || typeof ai.ask !== 'function' || ai.__plainAnalysisPatched) return false;

    const originalAsk = ai.ask.bind(ai);
    ai.ask = function askPlainAnalysis(input = {}) {
      const raw = String(input.question || input.message || '').trim();
      return originalAsk({
        ...input,
        question: `${GUIDE}${raw}`,
        preferSmart: true,
        maxOutputTokens: 3200,
        temperature: 0.15
      });
    };

    ai.__plainAnalysisPatched = true;
    return true;
  }

  if (patchMushyAI()) return;

  const timer = setInterval(() => {
    if (patchMushyAI()) clearInterval(timer);
  }, 120);

  setTimeout(() => clearInterval(timer), 60000);
})();
