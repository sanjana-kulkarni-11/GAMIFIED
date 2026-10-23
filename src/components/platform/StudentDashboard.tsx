/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudentProgress, LearningModule, BCASemester, CodeEfficiencyComparison } from '../../types/game';
import { INITIAL_LEARNING_MODULES, CODE_COMPARISONS } from '../../data/initialData';
import { storageService } from '../../services/storageService';
import { soundManager } from '../../audio/soundManager';
import { 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Zap, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Clock, 
  Cpu, 
  Code, 
  Layers, 
  Database, 
  Globe, 
  FileText,
  Activity,
  Flame,
  Check
} from 'lucide-react';

interface StudentDashboardProps {
  progress: StudentProgress;
  onUpdateProgress: (updated: StudentProgress) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ progress, onUpdateProgress }) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'workbench' | 'formulas'>('modules');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [activeModule, setActiveModule] = useState<LearningModule>(INITIAL_LEARNING_MODULES[0]);
  
  // Interactive Code Workbench state
  const [activeCodeComparison, setActiveCodeComparison] = useState<CodeEfficiencyComparison>(CODE_COMPARISONS[0]);

  // Quiz state
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  const semesters = [
    { id: 'all', label: 'All Semesters' },
    { id: 'Sem 1-2 (Foundation & E-Waste)', label: 'Sem 1-2: Foundations & E-Waste' },
    { id: 'Sem 3 (DSA & Operating Systems)', label: 'Sem 3: DSA & OS' },
    { id: 'Sem 4 (DBMS & OOP Systems)', label: 'Sem 4: DBMS & OOP' },
    { id: 'Sem 5-6 (Networks & Cloud Computing)', label: 'Sem 5-6: Networks & Cloud' },
  ];

  const filteredModules = INITIAL_LEARNING_MODULES.filter((m) => {
    if (selectedSemester !== 'all' && m.semester !== selectedSemester) return false;
    return true;
  });

  const startQuiz = () => {
    setQuizMode(true);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optionIdx,
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    activeModule.quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / activeModule.quizQuestions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);

    if (percentage >= 70) {
      soundManager.playPowerUp();
    } else {
      soundManager.playCrash();
    }

    const updated = { ...progress };
    updated.completedQuizIds[activeModule.id] = percentage;
    const bonusTokens = percentage === 100 ? 60 : 30;
    const bonusXP = percentage * 3;
    updated.recyclingTokens += bonusTokens;
    updated.xp += bonusXP;
    storageService.saveProgress(updated);
    onUpdateProgress(updated);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Student Profile Overview Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-lg">
            Lv.{progress.level}
          </div>
          <div>
            <div className="text-xs text-slate-400">Student Scholar</div>
            <div className="text-base font-bold text-white">{progress.nickname}</div>
            <div className="text-[11px] text-purple-300 font-mono">{progress.xp} Total XP</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Recycling Tokens</div>
            <div className="text-xl font-bold font-mono text-amber-300">{progress.recyclingTokens}</div>
            <div className="text-[11px] text-slate-400">Unlocked via exams & runs</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">BCA Syllabus Mastery</div>
            <div className="text-xl font-bold font-mono text-emerald-300">
              {Object.keys(progress.completedQuizIds).length} / {INITIAL_LEARNING_MODULES.length}
            </div>
            <div className="text-[11px] text-emerald-400">University Courses Passed</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">In-Game Code Gates</div>
            <div className="text-xl font-bold font-mono text-cyan-300">
              {progress.totalGatesCleared || 0} Cleared
            </div>
            <div className="text-[11px] text-slate-400">Algorithms Mastered</div>
          </div>
        </div>
      </div>

      {/* Main Hub Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'modules'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Syllabus Modules & Quizzes</span>
        </button>

        <button
          onClick={() => setActiveTab('workbench')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'workbench'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Algorithm Energy Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('formulas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'formulas'
              ? 'bg-purple-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>BCA Exam Formula Sheet</span>
        </button>
      </div>

      {/* Tab 1: Syllabus Modules & Quizzes */}
      {activeTab === 'modules' && (
        <div>
          {/* Semester Filter Bar */}
          <div className="flex flex-wrap gap-1.5 mb-6 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
            {semesters.map((sem) => (
              <button
                key={sem.id}
                onClick={() => setSelectedSemester(sem.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedSemester === sem.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sem.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Module Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Semester Courses ({filteredModules.length})
              </h3>

              {filteredModules.map((mod) => {
                const isSelected = activeModule.id === mod.id;
                const completionScore = progress.completedQuizIds[mod.id];

                return (
                  <div
                    key={mod.id}
                    onClick={() => {
                      setActiveModule(mod);
                      setQuizMode(false);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                        {mod.subject}
                      </span>
                      {completionScore !== undefined && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completionScore}%
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1 leading-snug">{mod.title}</h4>
                    <div className="text-[11px] text-slate-400 mb-2">{mod.semester}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{mod.readTime}</span>
                      <span>•</span>
                      <span>{mod.quizQuestions.length} Questions</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Module Content / Quiz Viewer */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8">
              {!quizMode ? (
                /* Reading Mode */
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                        <span>{activeModule.semester}</span>
                        <span>•</span>
                        <span>{activeModule.subject}</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mt-1 leading-tight">
                        {activeModule.title}
                      </h2>
                    </div>

                    <button
                      onClick={startQuiz}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Take Course Quiz ({activeModule.quizQuestions.length}Q)</span>
                    </button>
                  </div>

                  <p className="text-sm text-slate-300 italic mb-6 border-l-2 border-emerald-500 pl-3">
                    "{activeModule.summary}"
                  </p>

                  {/* Module Text Paragraphs */}
                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed mb-8">
                    {activeModule.content.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {/* Key Takeaways Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      <span>University Exam Core Takeaways</span>
                    </h4>
                    <ul className="space-y-2">
                      {activeModule.keyTakeaways.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={startQuiz}
                      className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <span>Take Assessment Quiz</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Quiz Mode */
                <div>
                  <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-800">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">Assessment Quiz</div>
                      <h3 className="text-lg font-bold text-white">{activeModule.title}</h3>
                    </div>

                    <button
                      onClick={() => setQuizMode(false)}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Back to Lesson
                    </button>
                  </div>

                  {!quizSubmitted ? (
                    /* Quiz Question Player */
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                        <span>
                          Question {currentQuestionIdx + 1} of {activeModule.quizQuestions.length}
                        </span>
                        <span className="text-emerald-400 font-semibold">
                          Subject: {activeModule.quizQuestions[currentQuestionIdx].topic}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{
                            width: `${((currentQuestionIdx + 1) / activeModule.quizQuestions.length) * 100}%`,
                          }}
                        />
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-white mb-6">
                        {activeModule.quizQuestions[currentQuestionIdx].question}
                      </h4>

                      <div className="space-y-3 mb-8">
                        {activeModule.quizQuestions[currentQuestionIdx].options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[currentQuestionIdx] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(optIdx)}
                              className={`w-full p-4 rounded-xl border text-sm font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30'
                                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span>{opt}</span>
                              <span
                                className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                                  isSelected ? 'border-emerald-400 bg-emerald-500 text-slate-950 font-bold' : 'border-slate-600'
                                }`}
                              >
                                {isSelected ? '✓' : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center">
                        <button
                          disabled={currentQuestionIdx === 0}
                          onClick={() => setCurrentQuestionIdx((p) => p - 1)}
                          className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                        >
                          Previous
                        </button>

                        {currentQuestionIdx < activeModule.quizQuestions.length - 1 ? (
                          <button
                            onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Next Question
                          </button>
                        ) : (
                          <button
                            onClick={handleSubmitQuiz}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                          >
                            Submit Answers
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Quiz Results Screen */
                    <div className="text-center py-6">
                      <div
                        className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-black ${
                          quizScore >= 70 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {quizScore}%
                      </div>

                      <h3 className="text-2xl font-black text-white mb-2">
                        {quizScore === 100
                          ? 'Syllabus Mastery Achieved!'
                          : quizScore >= 70
                          ? 'Assessment Passed!'
                          : 'Review Required'}
                      </h3>

                      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                        {quizScore >= 70
                          ? 'Excellent engineering knowledge! You earned bonus tokens and demonstrated core BCA principles.'
                          : 'You scored below passing mark (70%). Review the lecture notes and try again.'}
                      </p>

                      <div className="space-y-4 text-left max-w-lg mx-auto mb-8">
                        {activeModule.quizQuestions.map((q, idx) => {
                          const userAns = selectedAnswers[idx];
                          const isCorrect = userAns === q.correctIndex;
                          return (
                            <div
                              key={q.id}
                              className={`p-3.5 rounded-xl border ${
                                isCorrect ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-rose-950/30 border-rose-500/40'
                              }`}
                            >
                              <div className="text-xs font-bold text-white mb-1">
                                Q{idx + 1}: {q.question}
                              </div>
                              <div className="text-[11px] text-slate-300">
                                Your answer: <span className={isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                  {userAns !== undefined ? q.options[userAns] : 'Not answered'}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="text-[11px] text-emerald-400 mt-0.5">
                                  Correct: {q.options[q.correctIndex]}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 mt-1 italic">
                                {q.explanation}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-center gap-3">
                        <button
                          onClick={startQuiz}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Retry Quiz</span>
                        </button>

                        <button
                          onClick={() => setQuizMode(false)}
                          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                        >
                          Back to Course
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Code & Algorithm Energy Simulator */}
      {activeTab === 'workbench' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
              <Code className="w-5 h-5 text-cyan-400" />
              <span>BCA Code & Algorithm Energy Simulator</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Compare naive vs optimized algorithms taught in BCA Semester 3 & 4. See real hardware CPU cycles, memory allocations, and estimated Joule savings!
            </p>

            {/* Select comparison demo */}
            <div className="flex flex-wrap gap-2 mb-6">
              {CODE_COMPARISONS.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => setActiveCodeComparison(comp)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeCodeComparison.id === comp.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {comp.title}
                </button>
              ))}
            </div>

            {/* Problem Statement Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                Problem Statement ({activeCodeComparison.subject})
              </div>
              <div className="text-sm font-semibold text-white">{activeCodeComparison.problemStatement}</div>
            </div>

            {/* Side-by-Side Code Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Naive / Unoptimized Code */}
              <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
                      <span>{activeCodeComparison.naiveCode.title}</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold">
                      {activeCodeComparison.naiveCode.complexity}
                    </span>
                  </div>

                  <pre className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed mb-4">
                    <code>{activeCodeComparison.naiveCode.code}</code>
                  </pre>

                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex justify-between text-slate-400">
                      <span>CPU Instructions:</span>
                      <span className="font-mono text-rose-300 font-bold">{activeCodeComparison.naiveCode.cpuCycles}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Energy Draw per Call:</span>
                      <span className="font-mono text-rose-400 font-bold">{activeCodeComparison.naiveCode.estimatedEnergy}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic border-t border-slate-800 pt-3">
                  {activeCodeComparison.naiveCode.explanation}
                </p>
              </div>

              {/* Optimized Code */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between ring-1 ring-emerald-500/20">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 fill-emerald-400" />
                      <span>{activeCodeComparison.optimizedCode.title}</span>
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold">
                      {activeCodeComparison.optimizedCode.complexity}
                    </span>
                  </div>

                  <pre className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs font-mono text-emerald-200 overflow-x-auto leading-relaxed mb-4">
                    <code>{activeCodeComparison.optimizedCode.code}</code>
                  </pre>

                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex justify-between text-slate-400">
                      <span>CPU Instructions:</span>
                      <span className="font-mono text-emerald-300 font-bold">{activeCodeComparison.optimizedCode.cpuCycles}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Energy Draw per Call:</span>
                      <span className="font-mono text-emerald-400 font-bold">{activeCodeComparison.optimizedCode.estimatedEnergy}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">Cloud Energy Saved:</span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      ~{activeCodeComparison.energySavedPercent}% Reduction
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {activeCodeComparison.optimizedCode.explanation}
                  </p>
                </div>
              </div>
            </div>

            {/* University Takeaway Card */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-xs uppercase tracking-wide text-emerald-300">BCA Developer Takeaway: </span>
                <span className="text-xs text-slate-200">{activeCodeComparison.bcaTakeaway}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: BCA Formula & Exam Cheatsheet */}
      {activeTab === 'formulas' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span>BCA University Exam Core Formulas & Reference Sheet</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              High-yield equations, complexity orders, and architectural models essential for BCA semester examinations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formula 1 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  Cloud Data Center Efficiency (PUE)
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 my-2 text-center font-mono font-bold text-base text-emerald-300">
                  PUE = (Total Facility Energy) / (IT Equipment Energy)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ideal PUE is 1.0 (100% of power used directly by IT servers). Legacy facilities have PUE ≈ 2.0 (wasting 1 Watt on cooling for every 1 Watt of compute).
                </p>
              </div>

              {/* Formula 2 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                  CMOS Dynamic Processor Power Formula
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 my-2 text-center font-mono font-bold text-base text-amber-300">
                  P = C · V² · f
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  C = Capacitance, V = Supply Voltage, f = Clock Frequency. Because voltage is squared (V²), DVFS down-volting yields quadratic energy reduction!
                </p>
              </div>

              {/* Formula 3 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                  Big-O Algorithmic Growth Order
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 my-2 text-center font-mono font-bold text-sm text-purple-300">
                  O(1) &lt; O(log N) &lt; O(N) &lt; O(N log N) &lt; O(N²) &lt; O(2^N)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Always target O(1) or O(log N) for searches, and O(N log N) for sorting. Avoid O(N²) nested loops on cloud backend servers.
                </p>
              </div>

              {/* Formula 4 */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">
                  OSI 7-Layer Architecture
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 my-2 text-center font-mono text-xs text-teal-300">
                  7. Application → 6. Presentation → 5. Session → 4. Transport (TCP/UDP) → 3. Network (IP) → 2. Data Link → 1. Physical
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mnemonic: <span className="text-white font-bold">A</span>ll <span className="text-white font-bold">P</span>eople <span className="text-white font-bold">S</span>eem <span className="text-white font-bold">T</span>o <span className="text-white font-bold">N</span>eed <span className="text-white font-bold">D</span>ata <span className="text-white font-bold">P</span>rocessing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
