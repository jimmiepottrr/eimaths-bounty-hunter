import React, { createContext, useContext, useMemo, useState } from 'react';
import { quests, rewards } from './data';

type QuizResult = {
  questId: string;
  score: number;
  total: number;
  earnedCoins: number;
  completedAt: string;
};

type PlayerState = {
  parentName: string;
  childName: string;
  email: string;
  gradeId: string;
  coins: number;
  streak: number;
  completedQuestIds: string[];
  quizResults: QuizResult[];
  redeemedRewardIds: string[];
};

type AppContextValue = {
  state: PlayerState;
  isLoggedIn: boolean;
  login: (payload: Pick<PlayerState, 'parentName' | 'childName' | 'email'>) => void;
  logout: () => void;
  selectGrade: (gradeId: string) => void;
  completeQuest: (questId: string, score: number, total: number) => number;
  redeemReward: (rewardId: string) => { ok: boolean; message: string };
  resetProgress: () => void;
  accuracy: number;
  totalEarnedCoins: number;
};

const storageKey = 'eimaths-bounty-hunter-state';

const initialState: PlayerState = {
  parentName: '',
  childName: '',
  email: '',
  gradeId: 'p1',
  coins: 60,
  streak: 0,
  completedQuestIds: [],
  quizResults: [],
  redeemedRewardIds: [],
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

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

    return {
      state,
      isLoggedIn: Boolean(state.email),
      login: (payload) => {
        updateState((current) => ({
          ...current,
          ...payload,
          coins: current.coins || initialState.coins,
        }));
      },
      logout: () => {
        updateState((current) => ({
          ...initialState,
          gradeId: current.gradeId,
        }));
      },
      selectGrade: (gradeId) => {
        updateState((current) => ({ ...current, gradeId }));
      },
      completeQuest: (questId, score, total) => {
        const quest = quests.find((item) => item.id === questId);
        const perfectBonus = score === total ? 10 : 0;
        const earnedCoins = Math.round((quest?.reward || 20) * (score / total)) + perfectBonus;

        updateState((current) => {
          const alreadyCompleted = current.completedQuestIds.includes(questId);
          return {
            ...current,
            coins: current.coins + earnedCoins,
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
          return { ok: false, message: 'ไม่พบของรางวัลนี้' };
        }
        if (state.redeemedRewardIds.includes(rewardId)) {
          return { ok: false, message: 'แลกของรางวัลนี้ไปแล้ว' };
        }
        if (state.coins < reward.cost) {
          return { ok: false, message: `ยังขาดอีก ${reward.cost - state.coins} เหรียญ` };
        }
        updateState((current) => ({
          ...current,
          coins: current.coins - reward.cost,
          redeemedRewardIds: [...current.redeemedRewardIds, rewardId],
        }));
        return { ok: true, message: `แลก ${reward.name} สำเร็จ` };
      },
      resetProgress: () => {
        updateState((current) => ({
          ...initialState,
          parentName: current.parentName,
          childName: current.childName,
          email: current.email,
          gradeId: current.gradeId,
        }));
      },
      accuracy: answered === 0 ? 0 : Math.round((correct / answered) * 100),
      totalEarnedCoins,
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
