import React from 'react';
import { Composition } from 'remotion';
import { ZAutomationLaunch } from './compositions/ZAutomationLaunch';
import { ZAutomationSquarePromo } from './compositions/ZAutomationSquarePromo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 9:16 Vertical Reel (Instagram Reels / TikTok / YouTube Shorts) */}
      <Composition
        id="ZAutomationLaunch"
        component={ZAutomationLaunch}
        durationInFrames={210} // 7 seconds at 30 fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'Z-AUTOMATION',
          tagline: 'Rekayasa Web 3D & Solusi Agen AI Otonom',
          domain: 'z-automation.my.id',
        }}
      />

      {/* 1:1 Square Feed Video (Instagram Feed / Carousel Video) */}
      <Composition
        id="ZAutomationSquarePromo"
        component={ZAutomationSquarePromo}
        durationInFrames={180} // 6 seconds at 30 fps
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          headline: 'REKAYASA WEB 3D & AGEN AI OTONOM',
          subheadline:
            'Bukan sekadar website biasa. Kami membangun pengalaman interaktif & agen cerdas.',
          domain: 'z-automation.my.id',
        }}
      />
    </>
  );
};
