import { generateSamples, splitSamples, rand } from "./generate";
import type { SurrogateModel, TrainResult } from "../types";

export interface TrainProgress {
  phase: "generating" | "training" | "evaluating" | "done";
  fraction: number;
  epoch: number;
  trainLoss: number;
  valLoss: number;
  message: string;
}

const INPUT_DIM = 8;
const OUTPUT_DIM = 4;
const HIDDEN = 48;

function meanStd(values: number[][]): { mean: number[]; std: number[] } {
  const dim = values[0].length;
  const mean = new Array(dim).fill(0);
  for (const v of values) for (let i = 0; i < dim; i++) mean[i] += v[i];
  for (let i = 0; i < dim; i++) mean[i] /= values.length;
  const std = new Array(dim).fill(0);
  for (const v of values)
    for (let i = 0; i < dim; i++) std[i] += (v[i] - mean[i]) * (v[i] - mean[i]);
  for (let i = 0; i < dim; i++) std[i] = Math.sqrt(std[i] / values.length) || 1;
  return { mean, std };
}

export async function trainSurrogate(
  onProgress: (p: TrainProgress) => void
): Promise<TrainResult> {
  onProgress({ phase: "generating", fraction: 0.02, epoch: 0, trainLoss: 0, valLoss: 0, message: "Synthesising simulation dataset" });
  const N = 3000;
  const samples = generateSamples(N);
  const { train, val } = splitSamples(samples, 0.2);

  onProgress({ phase: "evaluating", fraction: 0.1, epoch: 0, trainLoss: 0, valLoss: 0, message: "Loading TensorFlow.js backend" });
  const tf = await import("@tensorflow/tfjs");
  await tf.ready();

  const trainX = train.map((s) => s.x);
  const trainY = train.map((s) => s.y);
  const valX = val.map((s) => s.x);
  const valY = val.map((s) => s.y);

  const xStats = meanStd(trainX);
  const yStats = meanStd(trainY);

  const norm = (x: number[]) => x.map((v, i) => (v - xStats.mean[i]) / xStats.std[i]);
  const zscore = (y: number[]) => y.map((v, i) => (v - yStats.mean[i]) / yStats.std[i]);
  const xTrain = tf.tensor2d(trainX.map(norm));
  const yTrain = tf.tensor2d(trainY.map(zscore));
  const xVal = tf.tensor2d(valX.map(norm));
  const yValT = tf.tensor2d(valY.map(zscore));

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: HIDDEN, activation: "relu", inputShape: [INPUT_DIM] }));
  model.add(tf.layers.dense({ units: HIDDEN, activation: "relu" }));
  model.add(tf.layers.dense({ units: OUTPUT_DIM }));

  model.compile({
    optimizer: tf.train.adam(0.0015),
    loss: "meanSquaredError",
  });

  const history: { epoch: number; trainLoss: number; valLoss: number }[] = [];
  const EPOCHS = 45;

  await model.fit(xTrain, yTrain, {
    epochs: EPOCHS,
    batchSize: 128,
    validationData: [xVal, yValT],
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        const tl = logs?.loss ?? 0;
        const vl = logs?.val_loss ?? 0;
        history.push({
          epoch: epoch + 1,
          trainLoss: tl,
          valLoss: vl,
        });
        onProgress({
          phase: "training",
          fraction: 0.15 + 0.75 * ((epoch + 1) / EPOCHS),
          epoch: epoch + 1,
          trainLoss: tl,
          valLoss: vl,
          message: `Epoch ${epoch + 1}/${EPOCHS}`,
        });
        await tf.nextFrame();
      },
    },
  });

  onProgress({ phase: "evaluating", fraction: 0.92, epoch: EPOCHS, trainLoss: 0, valLoss: 0, message: "Validating on held-out simulations" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weightArrays = model.getWeights().map((w: any) => w.arraySync());
  const w1 = weightArrays[0] as number[][];
  const b1 = weightArrays[1] as number[];
  const w2 = weightArrays[2] as number[][];
  const b2 = weightArrays[3] as number[];
  const w3 = weightArrays[4] as number[][];
  const b3 = weightArrays[5] as number[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const predY = (model.predict(xVal) as any);
  const predN = (await predY.array()) as number[][];
  const predArr = predN.map((row) =>
    row.map((v, i) => v * yStats.std[i] + yStats.mean[i])
  );
  predY.dispose();
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yValT.dispose();

  const r2 = computeR2(valY, predArr);
  const mae = computeMAE(valY, predArr);

  const modelObj: SurrogateModel = {
    inputMean: xStats.mean,
    inputStd: xStats.std,
    outputMean: yStats.mean,
    outputStd: yStats.std,
    w1,
    b1,
    w2,
    b2,
    w3,
    b3,
  };

  const t0 = performance.now();
  const trials = 300;
  for (let i = 0; i < trials; i++) {
    predictDeployed(modelObj, [rand(-8, 38), rand(0, 1000), rand(2, 80), rand(0, 1), 22, rand(0, 1), rand(0, 90), rand(0, 1)]);
  }
  const evalTimeUs = (performance.now() - t0) / trials * 1000;

  onProgress({ phase: "done", fraction: 1, epoch: EPOCHS, trainLoss: history[history.length - 1]?.trainLoss ?? 0, valLoss: history[history.length - 1]?.valLoss ?? 0, message: "Model deployed" });

  return {
    model: modelObj,
    history,
    r2,
    mae,
    parityTrue: valY.map((y) => y[0]),
    parityPred: predArr.map((y) => y[0]),
    evalTimeUs,
    samples: N,
  };
}

export function predictDeployed(m: SurrogateModel, x: number[]): number[] {
  const normX = x.map((v, i) => (v - m.inputMean[i]) / m.inputStd[i]);
  const h1 = dense(normX, m.w1, m.b1).map(relu);
  const h2 = dense(h1, m.w2, m.b2).map(relu);
  const raw = dense(h2, m.w3, m.b3);
  return raw.map((v, i) => v * (m.outputStd[i] || 1) + m.outputMean[i]);
}

function dense(x: number[], w: number[][], b: number[]): number[] {
  const outDim = w[0].length;
  const out = new Array<number>(outDim);
  for (let o = 0; o < outDim; o++) {
    let s = b[o];
    for (let i = 0; i < x.length; i++) s += x[i] * w[i][o];
    out[o] = s;
  }
  return out;
}

function relu(v: number): number {
  return v > 0 ? v : 0;
}

function computeR2(trueY: number[][], predY: number[][]): number {
  const means = trueY[0].map((_, i) => trueY.reduce((s, y) => s + y[i], 0) / trueY.length);
  const dims = trueY[0].map((_, i) => {
    let ssRes = 0;
    let ssTot = 0;
    for (let j = 0; j < trueY.length; j++) {
      ssRes += (trueY[j][i] - predY[j][i]) ** 2;
      ssTot += (trueY[j][i] - means[i]) ** 2;
    }
    return 1 - ssRes / (ssTot || 1);
  });
  return dims.reduce((s, d) => s + d, 0) / dims.length;
}

function computeMAE(trueY: number[][], predY: number[][]): number {
  let total = 0;
  let count = 0;
  for (let j = 0; j < trueY.length; j++) {
    for (let i = 0; i < trueY[j].length; i++) {
      total += Math.abs(trueY[j][i] - predY[j][i]);
      count += 1;
    }
  }
  return total / count;
}

export function serialiseModel(m: SurrogateModel): string {
  return JSON.stringify(m);
}

export function deserialiseModel(json: string): SurrogateModel {
  return JSON.parse(json) as SurrogateModel;
}