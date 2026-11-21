import React from 'react';
import { Composition } from 'remotion';
import { IpmEp01, EP01_FRAMES } from './episodes/ep01/IpmEp01';
import { IpmEp02, EP02_FRAMES } from './episodes/ep02/IpmEp02';
import { IpmEp03, EP03_FRAMES } from './episodes/ep03/IpmEp03';
import { PoCShotV3, POC_V3_FRAMES } from './episodes/poc_v3/PoCShotV3';

export const ChroniclesRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IpmEp01"
        component={IpmEp01}
        durationInFrames={EP01_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="IpmEp02"
        component={IpmEp02}
        durationInFrames={EP02_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="IpmEp03"
        component={IpmEp03}
        durationInFrames={EP03_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PoCShotV3"
        component={PoCShotV3}
        durationInFrames={POC_V3_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
