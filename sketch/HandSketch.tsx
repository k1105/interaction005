import dynamic from "next/dynamic";
import p5Types from "p5";
import { MutableRefObject } from "react";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { getSmoothedHandpose } from "../lib/getSmoothedHandpose";
import { updateHandposeHistory } from "../lib/updateHandposeHistory";
import { Keypoint } from "@tensorflow-models/hand-pose-detection";
import { getShapedRawHandpose } from "../lib/getShapedRawHandpose";

type Props = {
  handpose: MutableRefObject<handPoseDetection.Hand[]>;
};

const Sketch = dynamic(import("react-p5"), {
  loading: () => <></>,
  ssr: false,
});

export const HandSketch = ({ handpose }: Props) => {
  let handposeHistory: {
    left: Keypoint[][];
    right: Keypoint[][];
  } = { left: [], right: [] };
  const smoothedHandposeHistory: {
    left: Keypoint[][];
    right: Keypoint[][];
  } = { left: new Array(60).fill([]), right: new Array(60).fill([]) };

  const preload = (p5: p5Types) => {
    // 画像などのロードを行う
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.stroke(220);
    p5.fill(255);
    p5.strokeWeight(10);
  };

  const draw = (p5: p5Types) => {
    handposeHistory = updateHandposeHistory(handpose.current, handposeHistory); //handposeHistoryの更新
    const hands = getSmoothedHandpose(handpose.current, handposeHistory); //平滑化された手指の動きを取得する

    smoothedHandposeHistory.left.unshift(hands.left);
    smoothedHandposeHistory.right.unshift(hands.right);
    smoothedHandposeHistory.left.pop();
    smoothedHandposeHistory.right.pop();

    p5.background(1, 25, 96);
    for (let fingerIndex = 0; fingerIndex < 5; fingerIndex++) {
      p5.push();
      p5.translate(p5.width / 2 - 400 + fingerIndex * 200, p5.height / 2);

      for (let k = 0; k < 30; k++) {
        p5.push();
        p5.rotate((k * 2 * Math.PI) / 30);
        const index = k * 2;
        if (smoothedHandposeHistory.left[index].length !== 0) {
          const left_hand = smoothedHandposeHistory.left[index];
          for (let i = 0; i < 4; i++) {
            p5.ellipse(
              left_hand[i + 4 * fingerIndex].x - left_hand[0].x,
              left_hand[i + 4 * fingerIndex].y - left_hand[0].y,
              10
            );
          }
        }
        p5.pop();
      }
      p5.pop();
    }
  };

  const windowResized = (p5: p5Types) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return (
    <>
      <Sketch
        preload={preload}
        setup={setup}
        draw={draw}
        windowResized={windowResized}
      />
    </>
  );
};
