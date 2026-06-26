import React, { createContext, useContext, useMemo, useState } from 'react';
import { quests, rewards } from './data';

type QuizResult = {
  questId: string;
  score: number;
  total: number;
  earnedCoins: number;
  earnedExp: number;
  completedAt: string;
};

type PlayerState = {
  parentName: string;
  childName: string;
  email: string;
  gradeId: string;
  coins: number;
  exp: number;
  streak: number;
  soundEnabled: boolean;
  completedQuestIds: string[];
  quizResults: QuizResult[];
  redeemedRewardIds: string[];
};

type SoundName = 'tap' | 'success' | 'error' | 'reward' | 'level';

type AppContextValue = {
  state: PlayerState;
  isLoggedIn: boolean;
  login: (payload: Pick<PlayerState, 'parentName' | 'childName' | 'email'>) => void;
  logout: () => void;
  selectGrade: (gradeId: string) => void;
  completeQuest: (questId: string, score: number, total: number) => number;
  redeemReward: (rewardId: string) => { ok: boolean; message: string };
  resetProgress: () => void;
  toggleSound: () => void;
  playSound: (name: SoundName) => void;
  accuracy: number;
  totalEarnedCoins: number;
  level: number;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const storageKey = 'eimaths-bounty-hunter-state';

const initialState: PlayerState = {
  parentName: '',
  childName: '',
  email: '',
  gradeId: 'p4',
  coins: 2450,
  exp: 3680,
  streak: 7,
  soundEnabled: true,
  completedQuestIds: [],
  quizResults: [],
  redeemedRewardIds: [],
};

let audioContext: AudioContext | null = null;

const AppContext = createContext<AppContextValue | undefined>(undefined);

const playTone = (name: SoundName, enabled: boolean) => {
  if (!enabled) {
    return;
  }

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    return;
  }

  audioContext = audioContext || new AudioCtor();
  const context = audioContext;
  const now = context.currentTime;
  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  const patterns: Record<SoundName, number[]> = {
    tap: [520],
    success: [620, 820, 1040],
    error: [220, 160],
    reward: [660, 880, 1100, 1320],
    level: [440, 660, 880],
  };

  patterns[name].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = name === 'error' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.07);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.07);
    oscillator.stop(now + index * 0.07 + 0.08);
  });
};

const readState = (): PlayerState => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return initialState;
    }
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
};

const writeState = (state: PlayerState) => {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PlayerState>(() => readState());

  const updateState = (updater: (current: PlayerState) => PlayerState) => {
    setState((current) => {
      const next = updater(current);
      writeState(next);
      return next;
    });
  };

  const value = useMemo<AppContextValue>(() => {
    const answered = state.quizResults.reduce((sum, result) => sum + result.total, 0);
    const correct = state.quizResults.reduce((sum, result) => sum + result.score, 0);
    const totalEarnedCoins = state.quizResults.reduce((sum, result) => sum + result.earnedCoins, 0);
    const level = Math.max(1, Math.floor(state.exp / 300) + 1);

    return {
      state,
      isLoggedIn: Boolean(state.email),
      login: (payload) => {
        playTone('success', state.soundEnabled);
        updateState((current) => ({
          ...current,
          ...payload,
          coins: current.coins || initialState.coins,
          exp: current.exp || initialState.exp,
        }));
      },
      logout: () => {
        playTone('tap', state.soundEnabled);
        updateState((current) => ({
          ...initialState,
          gradeId: current.gradeId,
          soundEnabled: current.soundEnabled,
        }));
      },
      selectGrade: (gradeId) => {
        playTone('level', state.soundEnabled);
        updateState((current) => ({ ...current, gradeId }));
      },
      completeQuest: (questId, score, total) => {
        const quest = quests.find((item) => item.id === questId);
        const perfectBonus = score === total ? 50 : 0;
        const earnedCoins = Math.round((quest?.reward || 100) * (score / total)) + perfectBonus;
        const earnedExp = Math.round((quest?.exp || 50) * (score / total));
        playTone(score === total ? 'success' : 'level', state.soundEnabled);

        updateState((current) => {
          const alreadyCompleted = current.completedQuestIds.includes(questId);
          return {
            ...current,
            coins: current.coins + earnedCoins,
            exp: current.exp + earnedExp,
            streak: score > 0 ? current.streak + 1 : 0,
            completedQuestIds: alreadyCompleted
              ? current.completedQuestIds
              : [...current.completedQuestIds, questId],
            quizResults: [
              {
                questId,
                score,
                total,
                earnedCoins,
                earnedExp,
                completedAt: new Date().toISOString(),
              },
              ...current.quizResults,
            ].slice(0, 12),
          };
        });

        return earnedCoins;
      },
      redeemReward: (rewardId) => {
        const reward = rewards.find((item) => item.id === rewardId);
        if (!reward) {
          playTone('error', state.soundEnabled);
          return { ok: false, message: 'Reward not found.' };
        }
        if (state.redeemedRewardIds.includes(rewardId)) {
          playTone('error', state.soundEnabled);
          return { ok: false, message: 'This reward has already been redeemed.' };
        }
        if (state.coins < reward.cost) {
          playTone('error', state.soundEnabled);
          return { ok: false, message: `Need ${reward.cost - state.coins} more coins.` };
        }
        playTone('reward', state.soundEnabled);
        updateState((current) => ({
          ...current,
          coins: current.coins - reward.cost,
          redeemedRewardIds: [...current.redeemedRewardIds, rewardId],
        }));
        return { ok: true, message: `${reward.name} redeemed successfully.` };
      },
      resetProgress: () => {
        playTone('tap', state.soundEnabled);
        updateState((current) => ({
          ...initialState,
          parentName: current.parentName,
          childName: current.childName,
          email: current.email,
          gradeId: current.gradeId,
          soundEnabled: current.soundEnabled,
        }));
      },
      toggleSound: () => {
        updateState((current) => ({ ...current, soundEnabled: !current.soundEnabled }));
        playTone('tap', !state.soundEnabled);
      },
      playSound: (name) => playTone(name, state.soundEnabled),
      accuracy: answered === 0 ? 87 : Math.round((correct / answered) * 100),
      totalEarnedCoins,
      level,
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppState = () => {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useAppState must be used inside AppProvider');
  }
  return value;
};
