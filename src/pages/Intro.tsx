import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';

const scenes = [
  {
    image: 'assets/intro-voyage-3d.webp',
    mobileImage: 'assets/intro-voyage-mobile-3d.webp',
    eyebrow: 'ตำนานเริ่มต้น',
    title: 'ขุมทรัพย์แห่งปัญญา',
    caption: 'นานมาแล้ว จอมปราชญ์ผู้ยิ่งใหญ่ซ่อนขุมทรัพย์แห่งปัญญาไว้สุดปลายหมู่เกาะปริศนา ท่านฉีกแผนที่เป็น 4 ชิ้น มอบให้ผู้พิทักษ์ 4 ดินแดน',
    voice: 'assets/intro-voice-1.wav',
  },
  {
    image: 'assets/intro-obstacle-3d.webp',
    mobileImage: 'assets/intro-obstacle-mobile-3d.webp',
    eyebrow: 'ภัยคุกคาม',
    title: 'กิลด์เงาออกไล่ล่า',
    caption: '"ขุมทรัพย์นี้จะเป็นของผู้พิสูจน์ตนด้วยปัญญา มิใช่กำลัง" …แต่บัดนี้ กิลด์เงา นำโดย ลอร์ดเงา ออกไล่ล่าแผนที่ทุกชิ้น!',
    voice: 'assets/intro-voice-2.wav',
  },
  {
    image: 'assets/intro-call-3d.webp',
    mobileImage: 'assets/intro-call-mobile-3d.webp',
    eyebrow: 'ถึงตาเจ้าแล้ว',
    title: 'นักล่าแห่งกิลด์แสงดาว',
    caption: 'เจ้าคือนักล่าสมบัติฝึกหัดแห่งกิลด์แสงดาว จงออกเดินทางพร้อม "ปิ๊ง" นกฮูกเข็มทิศ… หยุดกิลด์เงา แล้วคว้าขุมทรัพย์มาให้ได้!',
    voice: 'assets/intro-voice-3.wav',
  },
];

type PreloadedScene = {
  imageUrl: string;
  voiceUrl: string;
  audio: HTMLAudioElement;
};

const minimumSceneDuration = 5.5;

const Intro: React.FC = () => {
  const navigate = useNavigate();
  const { playIntroSound, stopIntroSound, soundEnabled, toggleSound } = useAppState();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [sceneDuration, setSceneDuration] = useState(6);
  const preloadedRef = useRef<PreloadedScene[]>([]);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const totalAssets = scenes.length * 2;

  const clearTransitionTimer = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  };

  const finish = useCallback(() => {
    clearTransitionTimer();
    voiceRef.current?.pause();
    voiceRef.current = null;
    preloadedRef.current.forEach(({ audio }) => {
      audio.pause();
      audio.currentTime = 0;
    });
    stopIntroSound();
    navigate('/map');
  }, [navigate, stopIntroSound]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (voiceRef.current) {
      voiceRef.current.muted = !soundEnabled;
    }
  }, [soundEnabled]);

  useEffect(() => {
    const controller = new AbortController();
    const objectUrls: string[] = [];
    let active = true;

    const loadAsset = async (path: string) => {
      const response = await fetch(`${import.meta.env.BASE_URL}${path}`, {
        cache: 'force-cache',
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Unable to load ${path}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      objectUrls.push(objectUrl);
      if (active) {
        setLoadedCount((count) => count + 1);
      }
      return objectUrl;
    };

    const preload = async () => {
      setLoadedCount(0);
      setIsReady(false);
      setLoadError('');
      const useMobileArtwork = window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches;

      try {
        const loadedScenes = await Promise.all(
          scenes.map(async (scene) => {
            const [imageUrl, voiceUrl] = await Promise.all([
              loadAsset(useMobileArtwork ? scene.mobileImage : scene.image),
              loadAsset(scene.voice),
            ]);
            const audio = new Audio(voiceUrl);
            audio.preload = 'auto';
            audio.load();
            return { imageUrl, voiceUrl, audio };
          }),
        );

        if (active) {
          preloadedRef.current = loadedScenes;
          setIsReady(true);
        }
      } catch (error) {
        if (active && !controller.signal.aborted) {
          setLoadError(error instanceof Error ? error.message : 'The opening story could not be loaded.');
        }
      }
    };

    void preload();

    return () => {
      active = false;
      controller.abort();
      clearTransitionTimer();
      voiceRef.current?.pause();
      preloadedRef.current.forEach(({ audio }) => audio.pause());
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      preloadedRef.current = [];
      stopIntroSound();
    };
  }, [loadAttempt, stopIntroSound]);

  useEffect(() => {
    if (!isStarted || !isReady) {
      return;
    }

    clearTransitionTimer();
    const audio = preloadedRef.current[sceneIndex]?.audio;
    if (!audio) {
      return;
    }

    voiceRef.current = audio;
    audio.muted = !soundEnabledRef.current;
    audio.volume = 0.95;
    const sceneStartedAt = Date.now();
    let hasAdvanced = false;

    const advanceNow = () => {
      if (hasAdvanced) {
        return;
      }
      hasAdvanced = true;
      clearTransitionTimer();
      if (sceneIndex < scenes.length - 1) {
        const nextAudio = preloadedRef.current[sceneIndex + 1]?.audio;
        if (nextAudio) {
          nextAudio.currentTime = 0;
          nextAudio.muted = !soundEnabledRef.current;
          void nextAudio.play().catch(() => {
            // The visual fallback timer still advances the story.
          });
        }
        setSceneIndex(sceneIndex + 1);
      } else {
        transitionTimerRef.current = window.setTimeout(finish, 650);
      }
    };

    const moveForward = () => {
      const elapsedSeconds = (Date.now() - sceneStartedAt) / 1000;
      const remainingSeconds = Math.max(0, minimumSceneDuration - elapsedSeconds);
      clearTransitionTimer();
      transitionTimerRef.current = window.setTimeout(advanceNow, remainingSeconds * 1000);
    };

    const updateDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setSceneDuration(audio.duration + 0.65);
      }
    };

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', moveForward, { once: true });
    updateDuration();

    if (audio.paused) {
      void audio.play().catch(() => {
        setSceneDuration(6);
      });
    }

    const fallbackDuration = Number.isFinite(audio.duration) && audio.duration > 0
      ? Math.max(audio.duration + 2, minimumSceneDuration + 2)
      : minimumSceneDuration + 2;
    transitionTimerRef.current = window.setTimeout(advanceNow, fallbackDuration * 1000);

    return () => {
      clearTransitionTimer();
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', moveForward);
      if (voiceRef.current === audio) {
        audio.pause();
        voiceRef.current = null;
      }
    };
  }, [finish, isReady, isStarted, sceneIndex]);

  const startStory = () => {
    if (!isReady) {
      return;
    }

    const firstAudio = preloadedRef.current[0]?.audio;
    if (firstAudio) {
      firstAudio.currentTime = 0;
      firstAudio.muted = !soundEnabled;
      void firstAudio.play().catch(() => {
        // The opening can still play silently if the browser blocks audio.
      });
    }
    playIntroSound();
    setSceneIndex(0);
    setIsStarted(true);
  };

  if (!isStarted) {
    const progress = Math.round((loadedCount / totalAssets) * 100);
    const loaderArtwork = window.matchMedia('(max-width: 600px) and (orientation: portrait)').matches
      ? scenes[0].mobileImage
      : scenes[0].image;
    return (
      <section
        className="intro-loader"
        aria-label="Loading Eimaths opening story"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(1, 9, 29, 0.95) 0%, rgba(3, 22, 57, 0.38) 68%, rgba(2, 19, 48, 0.18) 100%), url(${import.meta.env.BASE_URL}${loaderArtwork})`,
        }}
      >
        <div className="intro-loader-content">
          <span className="intro-loader-mark">E</span>
          <p className="intro-loader-eyebrow">เตรียมตัวออกผจญภัย</p>
          <h1>{isReady ? 'เรื่องราวพร้อมแล้ว!' : 'กำลังโหลดเนื้อเรื่องและเสียง…'}</h1>
          <div
            className="intro-loader-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="intro-loader-status">
            {loadError || (isReady ? 'พร้อมครบ 3 ฉากแล้ว ลุยเลย!' : `โหลดแล้ว ${loadedCount}/${totalAssets} ไฟล์`)}
          </p>
          {loadError ? (
            <button className="cinema-button intro-start-button" type="button" onClick={() => setLoadAttempt((value) => value + 1)}>
              Try Again
            </button>
          ) : (
            <button
              className="cinema-button intro-start-button"
              type="button"
              onClick={startStory}
              disabled={!isReady}
            >
              เริ่มเนื้อเรื่อง
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="intro-cinematic" aria-label="Eimaths opening story">
      {scenes.map((scene, index) => (
        <article
          className={`intro-scene ${index === sceneIndex ? 'active' : ''}`}
          key={scene.image}
          style={{
            backgroundImage: `url(${preloadedRef.current[index]?.imageUrl || `${import.meta.env.BASE_URL}${scene.image}`})`,
          }}
          aria-hidden={index !== sceneIndex}
        >
          <div className="intro-copy" aria-live="polite">
            <span>{scene.eyebrow}</span>
            <h1>{scene.title}</h1>
            <p>{scene.caption}</p>
          </div>
        </article>
      ))}

      <div className="intro-controls">
        <div className="intro-dots" aria-label={`Scene ${sceneIndex + 1} of ${scenes.length}`}>
          {scenes.map((scene, index) => (
            <span className={index === sceneIndex ? 'active' : ''} key={scene.image} />
          ))}
        </div>
        <button className="cinema-button" type="button" onClick={toggleSound}>
          {soundEnabled ? '🔊 เสียงเปิด' : '🔇 เสียงปิด'}
        </button>
        <button className="cinema-button" type="button" onClick={finish}>
          {sceneIndex === scenes.length - 1 ? 'เริ่มผจญภัย →' : 'ข้ามเนื้อเรื่อง'}
        </button>
      </div>
      <div
        className="intro-progress"
        key={sceneIndex}
        style={{ animationDuration: `${sceneDuration}s` }}
      />
    </section>
  );
};

export default Intro;
