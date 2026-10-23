/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentProgress, UserRole, RunSummary, LeaderboardEntry, Mission, Achievement } from '../types/game';
import { INITIAL_MISSIONS, INITIAL_ACHIEVEMENTS, DEMO_LEADERBOARD } from '../data/initialData';

const STORAGE_KEY_PROGRESS = 'ecorush_student_progress_v1';
const STORAGE_KEY_RUNS = 'ecorush_runs_history_v1';
const STORAGE_KEY_MISSIONS = 'ecorush_missions_v1';
const STORAGE_KEY_ACHIEVEMENTS = 'ecorush_achievements_v1';
const STORAGE_KEY_LEADERBOARD = 'ecorush_leaderboard_v1';

export const DEFAULT_STUDENT_PROGRESS: StudentProgress = {
  userId: 'user_bca_default',
  nickname: 'Kavya_GreenRunner',
  email: 'kavya.bca@campus.edu',
  batch: 'BCA 3rd Sem A',
  role: 'student',
  level: 1,
  xp: 0,
  recyclingTokens: 100, // starting bonus for unlocks
  ecoCrystals: 5,
  highScore: 0,
  longestDistance: 0,
  totalRuns: 0,
  totalDistance: 0,
  totalOrbs: 0,
  totalTokensCollected: 0,
  totalGatesCleared: 0,
  selectedCharacterId: 'aarav_sprinter',
  selectedSkinId: 'aarav_default',
  selectedTrailId: 'trail_emerald',
  unlockedCharacterIds: ['aarav_sprinter'],
  unlockedSkinIds: ['aarav_default', 'ananya_default', 'kabir_default'],
  unlockedTrailIds: ['trail_emerald'],
  completedQuizIds: {},
  unlockedAchievements: [],
  restorationLevel: 1, // 1 to 5
};

class StorageService {
  // Check if Supabase env is present (ready for Supabase without crashing if absent)
  public isSupabaseConfigured(): boolean {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  }

  public getProgress(): StudentProgress {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (!data) return DEFAULT_STUDENT_PROGRESS;
      return { ...DEFAULT_STUDENT_PROGRESS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_STUDENT_PROGRESS;
    }
  }

  public saveProgress(progress: StudentProgress): void {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage', e);
    }
  }

  public updateRole(role: UserRole): StudentProgress {
    const p = this.getProgress();
    p.role = role;
    this.saveProgress(p);
    return p;
  }

  public getMissions(): Mission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MISSIONS);
      if (!data) return INITIAL_MISSIONS;
      return JSON.parse(data);
    } catch {
      return INITIAL_MISSIONS;
    }
  }

  public saveMissions(missions: Mission[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_MISSIONS, JSON.stringify(missions));
    } catch (e) {
      console.warn('Failed to save missions', e);
    }
  }

  public getAchievements(): Achievement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
      if (!data) return INITIAL_ACHIEVEMENTS;
      return JSON.parse(data);
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  }

  public saveAchievements(achievements: Achievement[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (e) {
      console.warn('Failed to save achievements', e);
    }
  }

  public getRunsHistory(): RunSummary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RUNS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public saveRun(run: RunSummary): {
    updatedProgress: StudentProgress;
    newAchievements: Achievement[];
    completedMissions: Mission[];
  } {
    const progress = this.getProgress();
    const runs = this.getRunsHistory();
    runs.unshift(run);
    // Keep last 30 runs
    if (runs.length > 30) runs.pop();
    try {
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(runs));
    } catch {
      // safe fallback
    }

    // Update progress
    progress.totalRuns += 1;
    progress.totalDistance += run.distance;
    progress.totalOrbs += run.energyOrbs;
    progress.totalTokensCollected += run.recyclingTokens;
    progress.totalGatesCleared = (progress.totalGatesCleared || 0) + (run.codeGatesCleared || 0);
    progress.recyclingTokens += run.recyclingTokens;
    progress.xp += run.xpEarned;

    // Check level up (every 300 XP = +1 level)
    progress.level = Math.max(1, Math.floor(progress.xp / 300) + 1);

    // City restoration progress (1 to 5)
    progress.restorationLevel = Math.min(5, Math.max(1, Math.floor(progress.totalDistance / 1500) + 1));

    if (run.score > progress.highScore) {
      progress.highScore = run.score;
    }
    if (run.distance > progress.longestDistance) {
      progress.longestDistance = run.distance;
    }

    // Check Missions progress
    const missions = this.getMissions();
    const newlyCompletedMissions: Mission[] = [];

    missions.forEach((m) => {
      if (m.completed) return;
      if (m.type === 'distance' && run.distance >= m.targetCount) {
        m.completed = true;
        newlyCompletedMissions.push(m);
      } else if (m.type === 'orbs') {
        m.currentCount += run.energyOrbs;
        if (m.currentCount >= m.targetCount) {
          m.completed = true;
          newlyCompletedMissions.push(m);
        }
      } else if (m.type === 'tokens') {
        m.currentCount += run.recyclingTokens;
        if (m.currentCount >= m.targetCount) {
          m.completed = true;
          newlyCompletedMissions.push(m);
        }
      } else if (m.type === 'knowledge') {
        m.currentCount += run.knowledgeFragments;
        if (m.currentCount >= m.targetCount) {
          m.completed = true;
          newlyCompletedMissions.push(m);
        }
      } else if (m.type === 'syllabus_gates') {
        m.currentCount += run.codeGatesCleared;
        if (m.currentCount >= m.targetCount) {
          m.completed = true;
          newlyCompletedMissions.push(m);
        }
      }
    });
    this.saveMissions(missions);

    // Check Achievements
    const achievements = this.getAchievements();
    const newlyUnlockedAchievements: Achievement[] = [];

    achievements.forEach((ach) => {
      if (ach.unlocked) return;
      let targetMet = false;
      if (ach.metric === 'high_score' && progress.highScore >= ach.requirement) {
        targetMet = true;
      } else if (ach.metric === 'total_distance' && progress.totalDistance >= ach.requirement) {
        targetMet = true;
      } else if (ach.metric === 'total_tokens' && progress.totalTokensCollected >= ach.requirement) {
        targetMet = true;
      } else if (ach.metric === 'runs_played' && progress.totalRuns >= ach.requirement) {
        targetMet = true;
      } else if (ach.metric === 'code_gates_passed' && progress.totalGatesCleared >= ach.requirement) {
        targetMet = true;
      }

      if (targetMet) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toISOString();
        progress.recyclingTokens += ach.rewardTokens;
        if (!progress.unlockedAchievements.includes(ach.id)) {
          progress.unlockedAchievements.push(ach.id);
        }
        newlyUnlockedAchievements.push(ach);
      }
    });
    this.saveAchievements(achievements);

    this.saveProgress(progress);
    this.syncPlayerToLeaderboard(progress);

    return {
      updatedProgress: progress,
      newAchievements: newlyUnlockedAchievements,
      completedMissions: newlyCompletedMissions,
    };
  }

  public getLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      let list: LeaderboardEntry[] = data ? JSON.parse(data) : DEMO_LEADERBOARD;
      
      const progress = this.getProgress();
      // Ensure player is present
      const playerIndex = list.findIndex(e => e.isCurrentPlayer || e.id === 'player_self');
      const playerEntry: LeaderboardEntry = {
        id: 'player_self',
        nickname: progress.nickname + ' (You)',
        batch: progress.batch,
        highScore: progress.highScore,
        longestDistance: progress.longestDistance,
        totalTokens: progress.totalTokensCollected,
        quizScore: this.getAverageQuizScore(progress),
        syllabusGatesMastered: progress.totalGatesCleared || 0,
        isCurrentPlayer: true,
        avatarSeed: 'player',
      };

      if (playerIndex >= 0) {
        list[playerIndex] = playerEntry;
      } else {
        list.push(playerEntry);
      }

      return list.sort((a, b) => b.highScore - a.highScore);
    } catch {
      return DEMO_LEADERBOARD;
    }
  }

  private syncPlayerToLeaderboard(progress: StudentProgress) {
    const list = this.getLeaderboard();
    try {
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(list));
    } catch {
      // safe fallback
    }
  }

  public getAverageQuizScore(progress: StudentProgress): number {
    const scores = Object.values(progress.completedQuizIds);
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / scores.length);
  }

  public resetAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_PROGRESS);
      localStorage.removeItem(STORAGE_KEY_RUNS);
      localStorage.removeItem(STORAGE_KEY_MISSIONS);
      localStorage.removeItem(STORAGE_KEY_ACHIEVEMENTS);
      localStorage.removeItem(STORAGE_KEY_LEADERBOARD);
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
  }
}

export const storageService = new StorageService();
