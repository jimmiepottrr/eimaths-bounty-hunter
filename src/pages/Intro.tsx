import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';

const scenes = [
  {
    image: 'assets/intro-voyage-3d.png',
    eyebrow: 'The adventure begins',
    title: 'A mysterious island is calling',
    caption: 'Eimaths follows an ancient map toward a temple filled with math treasure.',
    dialogue: "Howdy, young bounty hunter! I found a mysterious map. Let's sail for Math Island!",
    voice: 'assets/intro-voice-1.wav',
  },
  {
    image: 'assets/intro-obstacle-3d.png',
    eyebrow: 'Trouble ahead',
    title: 'The path is broken',
    caption: 'A locked temple and a missing bridge block the way. Every clue is a math challenge.',
    dialogue: 'Oh no! The bridge is broken, and the temple is locked by math puzzles.',
    voice: 'assets/intro-voice-2.wav',
  },
  {
    image: 'assets/intro-call-3d.png',
    eyebrow: 'A hero is needed',
    title: 'Will you help Eimaths?',
    caption: 'Solve each puzzle, rebuild the path, and unlock the legendary treasure together.',
    dialogue: "I can't do this alone. Will you join me and help unlock the treasure?",
    voice: 'assets/intro-voice-3.wav',
  },
];

const Intro: React.FC = () => {
  const navigate = useNavigate();
  const { playIntroSound, stopIntroSound, state, toggleSound } = useAppState();
  const [sceneIndex, setSceneIndex] = useState(0);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const finish = () => {
    voiceRef.current?.pause();
    stopIntroSound();
    navigate('/grade');
  };

  useEffect(() => {
    playIntroSound();
    const sceneTimer = window.setInterval(() => {
      setSceneIndex((current) => Math.min(current + 1, scenes.length - 1));
    }, 5500);
    const finishTimer = window.setTimeout(finish, 18000);

    return () => {
      window.clearInterval(sceneTimer);
      window.clearTimeout(finishTimer);
      stopIntroSound();
    };
  }, []);

  useEffect(() => {
    voiceRef.current?.pause();
    if (!state.soundEnabled) {
      return;
    }

    const voice = new Audio(`${import.meta.env.BASE_URL}${scenes[sceneIndex].voice}`);
    voice.volume = 0.95;
    voiceRef.current = voice;
    void voice.play().catch(() => {
      // Browsers may require the user to enable sound before media playback.
    });

    return () => {
      voice.pause();
      if (voiceRef.current === voice) {
        voiceRef.current = null;
      }
    };
  }, [sceneIndex, state.soundEnabled]);

  return (
    <section className="intro-cinematic" aria-label="Eimaths opening story">
      {scenes.map((scene, index) => (
        <article
          className={`intro-scene ${index === sceneIndex ? 'active' : ''}`}
          key={scene.image}
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}${scene.image})` }}
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
          {state.soundEnabled ? 'Sound on' : 'Sound off'}
        </button>
        <button className="cinema-button" type="button" onClick={finish}>
          {sceneIndex === scenes.length - 1 ? 'Start Adventure' : 'Skip Story'}
        </button>
      </div>
      <div className="intro-progress" key={sceneIndex} />
    </section>
  );
};

export default Intro;
