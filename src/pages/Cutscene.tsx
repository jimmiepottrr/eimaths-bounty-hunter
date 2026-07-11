import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState } from '../store';
import { AppScreen } from '../ui';
import { WORLDS } from '../world';
import { artUrl } from '../config';

/**
 * หน้าโหลดวิดีโอ cutscene — สเปกตาม Design Doc / COWORK-BRIEF ข้อ 5 (Jim สั่งเจาะจง):
 * 1. ภาพนิ่ง poster + หลอดโหลด 1–100% จากขนาดไฟล์จริง (fetch + ReadableStream)
 * 2. ปุ่ม "Let's Go!" สีเทากดไม่ได้ จนโหลดครบ 100% → เปลี่ยนส้ม + เด้ง
 * 3. <video> มี 2 source: H.265 ก่อน แล้วค่อย H.264 fallback — เบราว์เซอร์เลือกเอง
 * 4. เคยดูแล้วมีปุ่ม "ข้าม" · เฟสนี้ใช้ไฟล์ mp4 placeholder สั้นๆ
 */

type Stage = 'loading' | 'ready' | 'playing' | 'failed';

const Cutscene: React.FC = () => {
  const navigate = useNavigate();
  const { id = 'cutscene-1' } = useParams();
  const { hasWatchedCutscene, markCutsceneWatched, playSound } = useAppState();

  const world = useMemo(
    () => WORLDS.find((entry) => entry.boss.video === id) ?? WORLDS[0],
    [id],
  );

  const base = import.meta.env.BASE_URL;
  const h265Url = `${base}assets/cutscenes/${id}.h265.mp4`;
  const h264Url = `${base}assets/cutscenes/${id}.h264.mp4`;
  // ใช้อาร์ตบอสจริง (stylized 3D) เป็น poster; ถ้าโหลดไม่ได้ค่อย fallback placeholder เดิม
  const posterUrl = artUrl(world.boss.art);

  const [stage, setStage] = useState<Stage>('loading');
  const [percent, setPercent] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const watchedBefore = hasWatchedCutscene(id);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const leave = useCallback(() => {
    markCutsceneWatched(id);
    navigate('/map');
  }, [id, markCutsceneWatched, navigate]);

  // โหลดวิดีโอพร้อมวัด % จริงจากขนาดไฟล์ (Content-Length)
  useEffect(() => {
    let objectUrl: string | null = null;
    const controller = new AbortController();
    abortRef.current = controller;

    const preferH265 = document
      .createElement('video')
      .canPlayType('video/mp4; codecs="hvc1"');
    const primaryUrl = preferH265 ? h265Url : h264Url;
    const fallbackUrl = preferH265 ? h264Url : h265Url;

    const download = async (url: string) => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok || !response.body) {
        throw new Error(`fetch ${url} → ${response.status}`);
      }
      const total = Number(response.headers.get('Content-Length') ?? 0);
      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.byteLength;
          if (total > 0) {
            setPercent(Math.max(1, Math.min(100, Math.round((received / total) * 100))));
          }
        }
      }
      setPercent(100);
      return new Blob(chunks, { type: 'video/mp4' });
    };

    (async () => {
      try {
        let blob: Blob;
        try {
          blob = await download(primaryUrl);
        } catch (primaryError) {
          if (controller.signal.aborted) return;
          blob = await download(fallbackUrl);
        }
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setStage('ready');
        playSound('level');
      } catch {
        if (!controller.signal.aborted) {
          setStage('failed');
        }
      }
    })();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h264Url, h265Url]);

  const startPlayback = () => {
    if (stage !== 'ready') return; // ปุ่มเทากดไม่ได้จนกว่าจะครบ 100%
    playSound('reward');
    setStage('playing');
    window.setTimeout(() => {
      void videoRef.current?.play().catch(() => {
        /* ผู้ใช้กด play เองได้จาก controls */
      });
    }, 60);
  };

  return (
    <AppScreen className={`cutscene-screen theme-${world.theme}`}>
      {stage !== 'playing' ? (
        <div className="cutscene-loader">
          <div className="cutscene-poster" style={{ backgroundImage: `url(${posterUrl})` }}>
            <span className="cutscene-badge">🎬 เนื้อเรื่อง · {world.land}</span>
          </div>

          <h1>{world.boss.name}พ่ายแล้ว!</h1>
          <p className="cutscene-caption">{world.boss.clip}</p>

          {stage === 'failed' ? (
            <div className="error-box" role="alert">
              <p>โหลดวิดีโอไม่สำเร็จ — ข้ามไปก่อนได้เลย เนื้อเรื่องด้านบนครบถ้วนแล้ว</p>
            </div>
          ) : (
            <>
              <div className="load-track" aria-label={`โหลดแล้ว ${percent}%`}>
                <div className="load-fill" style={{ width: `${percent}%` }} />
              </div>
              <div className="load-percent">{percent}%</div>
            </>
          )}

          <div className="result-actions">
            <button
              type="button"
              className={`letsgo-button ${stage === 'ready' ? 'ready' : ''}`}
              disabled={stage !== 'ready'}
              onClick={startPlayback}
              data-testid="letsgo"
            >
              {stage === 'ready' ? "Let's Go! 🚀" : `กำลังโหลด… ${percent}%`}
            </button>
            {(watchedBefore || stage === 'failed') && (
              <button type="button" className="outline-button" onClick={leave} data-testid="skip">
                ข้าม →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="cutscene-player">
          <video
            ref={videoRef}
            poster={posterUrl}
            controls
            playsInline
            onEnded={leave}
            data-testid="cutscene-video"
          >
            {/* H.265 ก่อน → H.264 สำรอง (ใช้เมื่อโหลด blob ไม่ได้) — เบราว์เซอร์เลือกเองตามที่รองรับ */}
            {blobUrl ? (
              <source src={blobUrl} type="video/mp4" />
            ) : (
              <>
                <source src={h265Url} type='video/mp4; codecs="hvc1"' />
                <source src={h264Url} type='video/mp4; codecs="avc1.42E01E"' />
              </>
            )}
          </video>
          <p className="cutscene-caption">{world.boss.clip}</p>
          <button type="button" className="outline-button wide" onClick={leave}>
            จบเนื้อเรื่อง กลับแผนที่ →
          </button>
        </div>
      )}
    </AppScreen>
  );
};

export default Cutscene;
