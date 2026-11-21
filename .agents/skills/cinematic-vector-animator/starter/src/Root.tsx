import React from 'react';
import {Composition} from 'remotion';
import {TestScene, TestSceneProps} from './scenes/TestScene';
import bible from './art-bible.json';

export const Root: React.FC = () => {
  return (
    <Composition
      id="TestScene"
      component={TestScene}
      durationInFrames={210}
      fps={bible.format.fps}
      width={bible.format.width}
      height={bible.format.height}
      defaultProps={{showSafeZones: false} satisfies TestSceneProps}
    />
  );
};
