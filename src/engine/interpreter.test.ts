import { describe, expect, it, vi } from 'vitest';
import type { Edge } from '@xyflow/react';
import type { FlowNode } from '../types/nodes';
import { FlowInterpreter, evaluateCondition, parseInput, type RunEvent } from './interpreter';
import { interpolate, resolvePath } from './variables';

const node = (id: string, data: FlowNode['data']): FlowNode => ({
  id,
  type: data.type,
  position: { x: 0, y: 0 },
  data,
});

const edge = (source: string, target: string, sourceHandle = 'default'): Edge => ({
  id: `${source}-${sourceHandle}-${target}`,
  source,
  target,
  sourceHandle,
});

const collect = (interpreter: FlowInterpreter) => {
  const events: RunEvent[] = [];
  interpreter.subscribe((e) => events.push(e));
  return events;
};

const botMessages = (events: RunEvent[]) =>
  events.filter((e) => e.type === 'botMessage').map((e) => (e as { text: string }).text);

const visited = (events: RunEvent[]) =>
  events.filter((e) => e.type === 'enterNode').map((e) => (e as { nodeId: string }).nodeId);

describe('variables', () => {
  it('resolves dotted paths and array indexes', () => {
    const vars = { user: { name: 'Ada', tags: ['a', 'b'] }, n: 3 };
    expect(resolvePath(vars, 'user.name')).toBe('Ada');
    expect(resolvePath(vars, 'user.tags.1')).toBe('b');
    expect(resolvePath(vars, 'user.missing.deep')).toBeUndefined();
    expect(resolvePath(vars, 'n')).toBe(3);
  });

  it('interpolates placeholders and leaves unknown ones intact', () => {
    expect(interpolate('Hi {{ user.name }}, {{missing}}!', { user: { name: 'Ada' } })).toBe(
      'Hi Ada, {{missing}}!'
    );
    expect(interpolate('{{obj}}', { obj: { a: 1 } })).toBe('{"a":1}');
  });
});

describe('parseInput', () => {
  it('coerces numbers and validates email / phone', () => {
    expect(parseInput(' 42 ', 'number')).toEqual({ ok: true, value: 42 });
    expect(parseInput('abc', 'number').ok).toBe(false);
    expect(parseInput('a@b.co', 'email')).toEqual({ ok: true, value: 'a@b.co' });
    expect(parseInput('nope', 'email').ok).toBe(false);
    expect(parseInput('+1 (555) 010-9999', 'phone').ok).toBe(true);
    expect(parseInput('', 'text').ok).toBe(false);
  });
});

describe('evaluateCondition', () => {
  const cond = (
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty',
    value: string,
    variable = 'x'
  ) => ({ type: 'condition' as const, label: 'c', variable, operator, value });

  it('compares case-insensitively and numerically', () => {
    expect(evaluateCondition(cond('equals', 'Yes'), { x: 'yes' })).toBe(true);
    expect(evaluateCondition(cond('contains', 'bill'), { x: 'My Billing issue' })).toBe(true);
    expect(evaluateCondition(cond('greaterThan', '10'), { x: 11 })).toBe(true);
    expect(evaluateCondition(cond('greaterThan', '10'), { x: 'abc' })).toBe(false);
    expect(evaluateCondition(cond('lessThan', '10'), { x: '9' })).toBe(true);
    expect(evaluateCondition(cond('isEmpty', ''), {})).toBe(true);
    expect(evaluateCondition(cond('isEmpty', ''), { x: 'v' })).toBe(false);
  });

  it('resolves nested variables and interpolated compare values', () => {
    const vars = { res: { status: 'active' }, want: 'active' };
    expect(evaluateCondition(cond('equals', '{{want}}', 'res.status'), vars)).toBe(true);
  });
});

describe('FlowInterpreter', () => {
  const linearFlow = () => {
    const nodes = [
      node('m1', { type: 'message', label: 'Welcome', isStart: true, message: 'Hello!' }),
      node('i1', { type: 'input', label: 'Ask', variableName: 'name', inputType: 'text', prompt: 'Name?' }),
      node('m2', { type: 'message', label: 'Greet', message: 'Nice to meet you, {{name}}.' }),
      node('e1', { type: 'end', label: 'End', endMessage: 'Bye' }),
    ];
    const edges = [edge('m1', 'i1'), edge('i1', 'm2'), edge('m2', 'e1')];
    return { nodes, edges };
  };

  it('fails when no node is marked as start', async () => {
    const it_ = new FlowInterpreter([node('m', { type: 'message', label: 'm', message: 'x' })], []);
    const events = collect(it_);
    await it_.start();
    expect(it_.getStatus()).toBe('error');
    expect(events.some((e) => e.type === 'error')).toBe(true);
  });

  it('walks a linear flow, pauses on input, and resumes with the reply', async () => {
    const { nodes, edges } = linearFlow();
    const it_ = new FlowInterpreter(nodes, edges);
    const events = collect(it_);

    await it_.start();
    expect(it_.getStatus()).toBe('waitingForInput');
    expect(botMessages(events)).toEqual(['Hello!', 'Name?']);
    expect(visited(events)).toEqual(['m1', 'i1']);

    await it_.submitInput('Ada');
    expect(it_.getStatus()).toBe('finished');
    expect(botMessages(events)).toEqual(['Hello!', 'Name?', 'Nice to meet you, Ada.', 'Bye']);
    expect(visited(events)).toEqual(['m1', 'i1', 'm2', 'e1']);
    expect(it_.getVariables()).toEqual({ name: 'Ada' });
    expect(events.filter((e) => e.type === 'traverseEdge')).toHaveLength(3);
  });

  it('re-prompts on invalid input without advancing', async () => {
    const nodes = [
      node('i1', { type: 'input', label: 'Age', isStart: true, variableName: 'age', inputType: 'number', prompt: 'Age?' }),
      node('e1', { type: 'end', label: 'End', endMessage: '' }),
    ];
    const it_ = new FlowInterpreter(nodes, [edge('i1', 'e1')]);
    const events = collect(it_);
    await it_.start();
    await it_.submitInput('old');
    expect(it_.getStatus()).toBe('waitingForInput');
    expect(botMessages(events).at(-1)).toMatch(/not a number/);
    await it_.submitInput('30');
    expect(it_.getStatus()).toBe('finished');
    expect(it_.getVariables()).toEqual({ age: 30 });
  });

  it('branches on condition results', async () => {
    const nodes = [
      node('c1', { type: 'condition', label: 'Check', isStart: true, variable: 'topic', operator: 'contains', value: 'billing' }),
      node('yes', { type: 'message', label: 'Yes', message: 'billing path' }),
      node('no', { type: 'message', label: 'No', message: 'other path' }),
    ];
    const edges = [edge('c1', 'yes', 'true'), edge('c1', 'no', 'false')];

    const a = new FlowInterpreter(nodes, edges, { initialVariables: { topic: 'Billing question' } });
    const ea = collect(a);
    await a.start();
    expect(botMessages(ea)).toEqual(['billing path']);
    expect(a.getStatus()).toBe('finished'); // dead end after the message

    const b = new FlowInterpreter(nodes, edges, { initialVariables: { topic: 'login' } });
    const eb = collect(b);
    await b.start();
    expect(botMessages(eb)).toEqual(['other path']);
  });

  it('fires API calls, stores JSON responses, and picks success / failure', async () => {
    const nodes = [
      node('a1', { type: 'apiCall', label: 'Fetch', isStart: true, url: 'https://x.test/{{id}}', method: 'POST', headers: '{"X-Key": "k"}', body: '{"id": "{{id}}"}', responseVariable: 'res' }),
      node('ok', { type: 'message', label: 'Ok', message: 'Got {{res.name}}' }),
      node('bad', { type: 'message', label: 'Bad', message: 'failed' }),
    ];
    const edges = [edge('a1', 'ok', 'success'), edge('a1', 'bad', 'failure')];

    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('https://x.test/7');
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe('{"id": "7"}');
      expect((init?.headers as Record<string, string>)['X-Key']).toBe('k');
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
      return new Response(JSON.stringify({ name: 'Ada' }), { status: 200 });
    }) as unknown as typeof fetch;

    const ok = new FlowInterpreter(nodes, edges, { fetchImpl, initialVariables: { id: 7 } });
    const okEvents = collect(ok);
    await ok.start();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(botMessages(okEvents)).toEqual(['Got Ada']);
    expect(ok.getVariables().res).toEqual({ name: 'Ada' });

    const failing = (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch;
    const bad = new FlowInterpreter(nodes, edges, { fetchImpl: failing, initialVariables: { id: 1 } });
    const badEvents = collect(bad);
    await bad.start();
    expect(botMessages(badEvents)).toEqual(['failed']);

    const throwing = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    const err = new FlowInterpreter(nodes, edges, { fetchImpl: throwing, initialVariables: { id: 1 } });
    const errEvents = collect(err);
    await err.start();
    expect(botMessages(errEvents)).toEqual(['failed']);
    expect(errEvents.some((e) => e.type === 'system' && e.tone === 'error')).toBe(true);
  });

  it('stops runaway loops', async () => {
    const nodes = [
      node('m1', { type: 'message', label: 'A', isStart: true, message: 'a' }),
      node('m2', { type: 'message', label: 'B', message: 'b' }),
    ];
    const it_ = new FlowInterpreter(nodes, [edge('m1', 'm2'), edge('m2', 'm1')], { maxSteps: 10 });
    const events = collect(it_);
    await it_.start();
    expect(it_.getStatus()).toBe('error');
    expect(botMessages(events)).toHaveLength(10);
  });

  it('stop() halts a paused run and ignores later input', async () => {
    const { nodes, edges } = linearFlow();
    const it_ = new FlowInterpreter(nodes, edges);
    const events = collect(it_);
    await it_.start();
    it_.stop();
    expect(it_.getStatus()).toBe('idle');
    await it_.submitInput('Ada');
    expect(visited(events)).toEqual(['m1', 'i1']);
  });
});
