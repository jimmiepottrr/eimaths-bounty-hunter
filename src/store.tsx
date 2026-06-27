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
  playIntroSound: () => void;
  stopIntroSound: () => void;
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
let introSources: OscillatorNode[] = [];

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

const stopIntroScore = () => {
  introSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // The source may already have completed.
    }
  });
  introSources = [];
};

const playIntroScore = (enabled: boolean) => {
  if (!enabled) {
    return;
  }

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    return;
  }

  stopIntroScore();
  audioContext = audioContext || new AudioCtor();
  const context = audioContext;
  void context.resume();
  const now = context.currentTime;
  const master = context.createGain();
  master.connect(context.destination);
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.12, now + 0.6);
  master.gain.setValueAtTime(0.12, now + 14.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 17.5);

  const beat = 60 / 138;
  const whistleMelody = [659.25, 783.99, 880, 783.99, 659.25, 587.33, 659.25, 523.25];
  const banjoPattern = [261.63, 329.63, 392, 523.25, 293.66, 369.99, 440, 587.33];
  const bass = [130.81, 146.83, 110, 123.47];

  const scheduleNote = (
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ) => {
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(noteGain);
    noteGain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    introSources.push(oscillator);
  };

  for (let step = 0; step < 40; step += 1) {
    const start = now + step * beat;
    const phrase = Math.floor(step / 8);
    if (step % 2 === 0) {
      scheduleNote(
        whistleMelody[(step / 2 + phrase * 2) % whistleMelody.length],
        start,
        beat * 1.65,
        0.11,
        'sine',
      );
    }

    scheduleNote(
      bass[Math.floor(step / 4) % bass.length],
      start,
      beat * 0.75,
      step % 4 === 0 ? 0.13 : 0.08,
      'triangle',
    );

    scheduleNote(
      banjoPattern[(step + phrase) % banjoPattern.length] * 2,
      start,
      beat * 0.2,
      0.07,
      'square',
    );
    scheduleNote(
      banjoPattern[(step + phrase + 2) % banjoPattern.length] * 2,
      start + beat * 0.5,
      beat * 0.17,
      0.055,
      'square',
    );

    const kick = context.createOscillator();
    const kickGain = context.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(step % 4 === 0 ? 118 : 92, start);
    kick.frequency.exponentialRampToValueAtTime(46, start + 0.16);
    kickGain.gain.setValueAtTime(step % 4 === 0 ? 0.25 : 0.15, start);
    kickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
    kick.connect(kickGain);
    kickGain.connect(master);
    kick.start(start);
    kick.stop(start + 0.22);
    introSources.push(kick);

    if (step % 4 === 2) {
      scheduleNote(196, start, 0.1, 0.07, 'sawtooth');
    }

    if (step % 8 === 0) {
      const chordRoot = bass[Math.floor(step / 8) % bass.length] * 2;
      [1, 1.25, 1.5].forEach((ratio) => {
        scheduleNote(chordRoot * ratio, start, beat * 6.8, 0.035, 'sawtooth');
      });
    }
  }

  [0, 5.2, 10.8].forEach((offset, fanfareIndex) => {
    [392, 523.25, 659.25, 783.99].forEach((frequency, noteIndex) => {
      scheduleNote(
        frequency * (fanfareIndex === 2 ? 1.12 : 1),
        now + offset + noteIndex * 0.12,
        0.9,
        0.11,
        'sawtooth',
      );
    });
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
      playIntroSound: () => playIntroScore(state.soundEnabled),
      stopIntroSound: stopIntroScore,
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
