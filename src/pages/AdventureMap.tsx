import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../store';
import { AppScreen, ProgressBar, ScreenHeader } from '../ui';
import { getWorld, lastSceneOf } from '../world';
import { artUrl } from '../config';
import { landTrack, playMusic } from '../audio';

/**
 * Adventure Map — ดินแดนตามชั้นเรียนของผู้เล่น
 * โครง: ชั้นละ 4 ฉาก + บอส (ป.6 = 3 ฉาก + บอสใหญ่)
 * ปลดล็อกตามลำดับ: จบฉาก 1 → เปิดฉาก 2 … จบฉากสุดท้าย → เปิดบอส
 */
const AdventureMap: React.FC = () => {
  const navigate = useNavigate();
  const { player, progressFor, playSound } = useAppState();
  const [pingLine, setPingLine] = useState('');

  const grade = player?.grade ?? 3;
  const world = getWorld(grade);
  const progress = progressFor(grade);
  const totalNodes = world.scenes.length + 1; // ฉากทั้งหมด + บอส
  const clearedNodes = progress.clearedScenes + (progress.bossCleared ? 1 : 0);
  const bossUnlocked = progress.clearedScenes >= lastSceneOf(world);

  // ตำแหน่งปัจจุบันของผู้เล่น = โหนดแรกที่ยังไม่เคลียร์ (index ของฉาก หรือ = scenes.length เมื่อถึงคิวบอส)
  const currentIndex = progress.bossCleared ? -1 : progress.clearedScenes;

  // เพลงประจำดินแดน เริ่มตั้งแต่หน้าแผนที่
  useEffect(() => {
    playMusic(landTrack(grade));
  }, [grade]);

  const enterScene = (scene: number, ping: string) => {
    playSound('level');
    setPingLine(ping);
    window.setTimeout(() => navigate(`/quiz/${scene}`), 900);
  };

  const enterBoss = () => {
    playSound('level');
    setPingLine(world.boss.quote);
    window.setTimeout(() => navigate('/quiz/boss'), 1200);
  };

  return (
    <AppScreen className={`adventure-map-screen theme-${world.theme}`}>
      <ScreenHeader
        title={`${world.emoji} ${world.land}`}
        subtitle={`${world.gradeLabel} · ${world.scenes.length} ฉาก + บอส · ${world.timeLimitSec} วิ/ข้อ`}
        showBack
        right={
          <span className="map-progress-chip">
            {clearedNodes}/{totalNodes} ผ่านแล้ว
          </span>
        }
      />

      {pingLine && (
        <div className="ping-bubble" role="status">
          <span className="ping-owl">🦉</span>
          <p>ปิ๊ง: "{pingLine}"</p>
        </div>
      )}

      <div className="adventure-map-stage">
        {world.scenes.map((sceneDef, index) => {
          const unlocked = progress.clearedScenes >= index; // ฉากแรก unlock เสมอ
          const done = progress.clearedScenes > index;
          const isCurrent = index === currentIndex;
          const className = `map-node scene-node node-${index + 1} ${unlocked ? '' : 'locked'} ${done ? 'done' : ''} ${isCurrent ? 'current' : ''}`;

          return (
            <button
              type="button"
              key={sceneDef.scene}
              className={className}
              disabled={!unlocked}
              onClick={() => enterScene(sceneDef.scene, sceneDef.ping)}
              style={{ ['--node-art' as string]: `url(${artUrl(sceneDef.art)})` }}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isCurrent && <span className="you-are-here" aria-hidden="true">📍</span>}
              <b>{done ? '✓' : unlocked ? sceneDef.scene : '🔒'}</b>
              <span>{sceneDef.name}</span>
              <small>{done ? 'ผ่านแล้ว' : unlocked ? 'พร้อมลุย!' : 'ผ่านฉากก่อนหน้าเพื่อปลดล็อก'}</small>
            </button>
          );
        })}

        <button
          type="button"
          className={`map-node boss-node node-${world.scenes.length + 1} ${bossUnlocked ? '' : 'locked'} ${
            progress.bossCleared ? 'done' : ''
          } ${currentIndex === world.scenes.length ? 'current' : ''}`}
          disabled={!bossUnlocked}
          onClick={enterBoss}
          style={{ ['--node-art' as string]: `url(${artUrl(world.boss.art)})` }}
          aria-current={currentIndex === world.scenes.length ? 'step' : undefined}
        >
          {currentIndex === world.scenes.length && <span className="you-are-here" aria-hidden="true">📍</span>}
          <b>{progress.bossCleared ? '👑' : bossUnlocked ? '⚔️' : '🔒'}</b>
          <span>{world.boss.name}</span>
          <small>
            {progress.bossCleared
              ? 'ชนะแล้ว!'
              : bossUnlocked
                ? world.boss.title
                : `จบครบ ${world.scenes.length} ฉากเพื่อท้าบอส`}
          </small>
        </button>
      </div>

      <article className="map-journey-card">
        <div>
          <span>ความคืบหน้า {world.land}</span>
          <strong>{Math.round((clearedNodes / totalNodes) * 100)}%</strong>
        </div>
        <ProgressBar value={(clearedNodes / totalNodes) * 100} tone="gold" />
        <p>
          {progress.bossCleared
            ? `ได้ชิ้นส่วนแผนที่ของ${world.land}แล้ว! 🗺️`
            : bossUnlocked
              ? `${world.boss.name}รออยู่… เตรียมหัวใจ 3 ดวงให้พร้อม!`
              : 'ผ่านทุกฉากเพื่อเปิดทางสู่บอสประจำดินแดน'}
        </p>
      </article>
    </AppScreen>
  );
};

export default AdventureMap;
