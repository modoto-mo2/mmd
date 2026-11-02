import { useState } from 'react';
import { Award, CheckCircle2, HelpCircle, RotateCcw, Sparkles } from 'lucide-react';
import { QUIZ_QUESTIONS, SAADI_VERSES } from '../data/conferenceData';
import { calculateQuizResult } from '../utils/presentationLogic';

export default function InteractiveWorkshopSection() {
  const [selectedVerseIndex, setSelectedVerseIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const quizResult = calculateQuizResult(quizAnswers);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
  };

  return (
    <div className="space-y-8">
      {/* Part 1: Saadi's Bani Adam Interactive Literary & Humanitarian Visualizer */}
      <div className="bg-[#0b1120]/95 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="text-xs text-amber-400">
              گوهر ادب فارسی بر سردر سازمان ملل متحد · گلستان سعدی شیرازی
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-white">
              منشور جهانی همدلی در کلام شیخ اجل سعدی
            </h3>
          </div>
          <div className="text-xs text-slate-400">
            روی هر بیت کلیک کنید تا مفهوم و پیام انسانی آن باز شود
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 space-y-3">
            {SAADI_VERSES.map((verse, idx) => {
              const isSelected = idx === selectedVerseIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedVerseIndex(idx)}
                  className={`w-full text-right p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-lg'
                      : 'bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-amber-400 mb-2">
                    <span>بیت {idx + 1}</span>
                    <span>{isSelected ? 'انتخاب‌شده' : 'مشاهده پیام بیت'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base lg:text-lg font-bold leading-relaxed">
                    <div>{verse.hemistich1}</div>
                    <div className="sm:text-left text-amber-200">{verse.hemistich2}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>تفسیر و پیام بیت {selectedVerseIndex + 1}</span>
              </div>
              <p className="text-sm lg:text-base text-slate-100 leading-relaxed font-medium">
                {SAADI_VERSES[selectedVerseIndex].meaning}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-1.5">
              <div className="text-xs font-semibold text-slate-400">پیام کلیدی:</div>
              <p className="text-xs lg:text-sm text-amber-200/90 leading-relaxed">
                {SAADI_VERSES[selectedVerseIndex].lessonConnection}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Live Conference Audience Quiz */}
      <div className="bg-[#0b1120]/95 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="text-xs text-emerald-400">
              چالش تعاملی پایان کنفرانس · پرسش و پاسخ زنده با حضار
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-white">
              آزمون سریع «فرمانده امداد و دادرس»
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-300 bg-[#111827] border border-slate-800 px-3.5 py-2 rounded-lg font-mono tabular-nums">
              امتیاز: {quizResult.correctCount} از {quizResult.totalQuestions} ({quizResult.percentage}%)
            </div>
            {Object.keys(quizAnswers).length > 0 && (
              <button
                type="button"
                onClick={handleResetQuiz}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>شروع مجدد</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {QUIZ_QUESTIONS.map((q, qIdx) => {
            const chosen = quizAnswers[q.id];
            const isAnswered = typeof chosen === 'number';
            const isCorrect = chosen === q.correctIndex;

            return (
              <div
                key={q.id}
                className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>سؤال {qIdx + 1}</span>
                    {isAnswered && (
                      <span
                        className={
                          isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'
                        }
                      >
                        {isCorrect ? 'پاسخ صحیح ✓' : 'نادرست'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white leading-relaxed">{q.question}</p>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isThisSelected = chosen === oIdx;
                      const isThisCorrect = q.correctIndex === oIdx;

                      let btnStyle =
                        'bg-[#0b1120] border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white';
                      if (isAnswered) {
                        if (isThisCorrect) {
                          btnStyle = 'bg-emerald-950/80 border-emerald-500/70 text-emerald-200';
                        } else if (isThisSelected && !isThisCorrect) {
                          btnStyle = 'bg-rose-950/80 border-rose-500/70 text-rose-200';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          className={`w-full text-right px-3.5 py-2.5 text-xs font-medium rounded-lg border transition-colors flex items-center justify-between gap-2 ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isThisCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isAnswered && (
                  <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {quizResult.isComplete && (
          <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs text-emerald-300">نتیجه نهایی چالش کنفرانس:</div>
                <div className="text-base font-bold text-white">
                  درجه افتخاری: {quizResult.rankTitle} ({quizResult.percentage}% پاسخ درست)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetQuiz}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
            >
              تکرار چالش
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
