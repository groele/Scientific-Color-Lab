/// <reference lib="webworker" />

import { analyzePixels } from '@/domain/analyzer/extraction';
import type { AnalyzerWorkerRequest, AnalyzerWorkerResponse } from '@/domain/models';

self.onmessage = (event: MessageEvent<AnalyzerWorkerRequest>) => {
  const result = analyzePixels(event.data);
  const payload: AnalyzerWorkerResponse = { requestId: event.data.requestId, result };
  self.postMessage(payload);
};

export {};
