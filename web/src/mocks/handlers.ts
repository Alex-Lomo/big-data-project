import { ws } from 'msw';
import { metricHandler } from './handlers/metric-handler';

const live = ws.link('ws://localhost:5173');

export const handlers = [metricHandler(live)];
