import type { Edge } from '@xyflow/react';
import type {
  ApiCallNodeData,
  ConditionNodeData,
  FlowNode,
  InputNodeData,
} from '../types/nodes';
import {
  interpolate,
  resolvePath,
  formatValue,
  type Variables,
  type VariableValue,
} from './variables';

/*
 * A small interpreter for flows built on the canvas.
 *
 * It walks the graph from the "Start here" node, emitting events as it goes.
 * Execution is asynchronous because API Call nodes perform real HTTP requests
 * and Input nodes suspend until the user replies. The interpreter owns no UI;
 * the run store subscribes to its events and renders them.
 */

export type RunStatus =
  | 'idle'
  | 'running'
  | 'waitingForInput'
  | 'finished'
  | 'error';

export type SystemTone = 'info' | 'success' | 'warning' | 'error';

export type RunEvent =
  | { type: 'status'; status: RunStatus }
  | { type: 'enterNode'; nodeId: string }
  | { type: 'traverseEdge'; edgeId: string }
  | { type: 'botMessage'; nodeId: string; text: string }
  | { type: 'userMessage'; nodeId: string; text: string }
  | { type: 'system'; nodeId?: string; text: string; tone: SystemTone }
  | { type: 'variables'; variables: Variables }
  | {
      type: 'waitingForInput';
      nodeId: string;
      inputType: InputNodeData['inputType'];
      variableName: string;
    }
  | { type: 'finished'; nodeId?: string; reason: string }
  | { type: 'error'; nodeId?: string; message: string };

export interface InterpreterOptions {
  /** Delay between node transitions so the canvas highlight is visible. */
  stepDelayMs?: number;
  /** Hard cap on executed nodes, protecting against cycles without inputs. */
  maxSteps?: number;
  /** Timeout for API Call requests. */
  requestTimeoutMs?: number;
  /** Injectable fetch for tests and mocking. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Variables available before the first node runs. */
  initialVariables?: Variables;
}

type Listener = (event: RunEvent) => void;

const sleep = (ms: number) =>
  ms > 0 ? new Promise<void>((resolve) => setTimeout(resolve, ms)) : undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

/**
 * Validate and coerce user text for an Input node. Returns the stored value
 * or an error string the bot should show.
 */
export const parseInput = (
  text: string,
  inputType: InputNodeData['inputType']
): { ok: true; value: VariableValue } | { ok: false; error: string } => {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Please enter a value.' };
  }
  switch (inputType) {
    case 'number': {
      const n = Number(trimmed);
      if (Number.isNaN(n)) {
        return { ok: false, error: `"${trimmed}" is not a number. Please enter a number.` };
      }
      return { ok: true, value: n };
    }
    case 'email':
      if (!EMAIL_RE.test(trimmed)) {
        return { ok: false, error: `"${trimmed}" doesn't look like an email address. Please try again.` };
      }
      return { ok: true, value: trimmed };
    case 'phone':
      if (!PHONE_RE.test(trimmed)) {
        return { ok: false, error: `"${trimmed}" doesn't look like a phone number. Please try again.` };
      }
      return { ok: true, value: trimmed };
    default:
      return { ok: true, value: trimmed };
  }
};

/** Evaluate a Condition node against the current variables. */
export const evaluateCondition = (
  data: ConditionNodeData,
  variables: Variables
): boolean => {
  const actual = resolvePath(variables, data.variable);
  const expected = interpolate(data.value, variables);

  switch (data.operator) {
    case 'isEmpty':
      return (
        actual === undefined ||
        actual === null ||
        actual === '' ||
        (Array.isArray(actual) && actual.length === 0)
      );
    case 'equals':
      return formatValue(actual).trim().toLowerCase() === expected.trim().toLowerCase();
    case 'contains':
      return formatValue(actual).toLowerCase().includes(expected.toLowerCase());
    case 'greaterThan': {
      const a = Number(actual);
      const b = Number(expected);
      return !Number.isNaN(a) && !Number.isNaN(b) && a > b;
    }
    case 'lessThan': {
      const a = Number(actual);
      const b = Number(expected);
      return !Number.isNaN(a) && !Number.isNaN(b) && a < b;
    }
    default:
      return false;
  }
};

const OPERATOR_LABELS: Record<ConditionNodeData['operator'], string> = {
  equals: 'equals',
  contains: 'contains',
  greaterThan: 'is greater than',
  lessThan: 'is less than',
  isEmpty: 'is empty',
};

export class FlowInterpreter {
  private readonly nodes: Map<string, FlowNode>;
  private readonly edges: Edge[];
  private readonly options: Required<Omit<InterpreterOptions, 'fetchImpl'>> & {
    fetchImpl?: typeof fetch;
  };
  private readonly listeners = new Set<Listener>();

  private variables: Variables;
  private status: RunStatus = 'idle';
  private currentNodeId: string | null = null;
  private steps = 0;
  /** Incremented on stop/restart so stale async loops stop emitting. */
  private generation = 0;
  private abortController: AbortController | null = null;

  constructor(nodes: FlowNode[], edges: Edge[], options: InterpreterOptions = {}) {
    this.nodes = new Map(nodes.map((n) => [n.id, n]));
    this.edges = edges;
    this.options = {
      stepDelayMs: options.stepDelayMs ?? 0,
      maxSteps: options.maxSteps ?? 200,
      requestTimeoutMs: options.requestTimeoutMs ?? 10_000,
      initialVariables: options.initialVariables ?? {},
      fetchImpl: options.fetchImpl,
    };
    this.variables = { ...this.options.initialVariables };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): RunStatus {
    return this.status;
  }

  getVariables(): Variables {
    return { ...this.variables };
  }

  /** Begin execution at the node carrying the "Start here" chip. */
  async start(): Promise<void> {
    const startNode = [...this.nodes.values()].find((n) => n.data.isStart === true);
    if (!startNode) {
      this.fail('No node is marked "Start here".');
      return;
    }
    const generation = ++this.generation;
    this.steps = 0;
    this.variables = { ...this.options.initialVariables };
    this.setStatus('running');
    this.emit({ type: 'variables', variables: this.getVariables() });
    await this.enter(startNode.id, generation);
    await this.loop(generation);
  }

  /** Provide the user's reply while paused on an Input node. */
  async submitInput(text: string): Promise<void> {
    if (this.status !== 'waitingForInput' || !this.currentNodeId) return;
    const node = this.nodes.get(this.currentNodeId);
    if (!node || node.data.type !== 'input') return;

    const data = node.data as InputNodeData;
    const generation = this.generation;

    this.emit({ type: 'userMessage', nodeId: node.id, text });

    const parsed = parseInput(text, data.inputType);
    if (!parsed.ok) {
      this.emit({ type: 'botMessage', nodeId: node.id, text: parsed.error });
      this.emit({
        type: 'waitingForInput',
        nodeId: node.id,
        inputType: data.inputType,
        variableName: data.variableName,
      });
      return;
    }

    const name = data.variableName.trim();
    if (name) {
      this.variables[name] = parsed.value;
      this.emit({ type: 'variables', variables: this.getVariables() });
    } else {
      this.emit({
        type: 'system',
        nodeId: node.id,
        tone: 'warning',
        text: `Input node "${data.label}" has no variable name, so the reply was not stored.`,
      });
    }

    this.setStatus('running');
    const moved = await this.advance(node.id, null, generation);
    if (moved) await this.loop(generation);
  }

  /** Abort the run. Any in-flight request is cancelled. */
  stop(): void {
    this.generation += 1;
    this.abortController?.abort();
    this.abortController = null;
    if (this.status === 'running' || this.status === 'waitingForInput') {
      this.setStatus('idle');
    }
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private emit(event: RunEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private setStatus(status: RunStatus) {
    this.status = status;
    this.emit({ type: 'status', status });
  }

  private fail(message: string, nodeId?: string) {
    this.emit({ type: 'error', nodeId, message });
    this.setStatus('error');
  }

  private finish(reason: string, nodeId?: string) {
    this.emit({ type: 'finished', nodeId, reason });
    this.setStatus('finished');
  }

  private isStale(generation: number) {
    return generation !== this.generation;
  }

  private async enter(nodeId: string, generation: number) {
    if (this.isStale(generation)) return;
    this.currentNodeId = nodeId;
    this.emit({ type: 'enterNode', nodeId });
    await sleep(this.options.stepDelayMs);
  }

  /** Run nodes until the flow pauses, finishes, errors, or is stopped. */
  private async loop(generation: number) {
    while (this.status === 'running' && !this.isStale(generation)) {
      const nodeId = this.currentNodeId;
      if (!nodeId) {
        this.fail('Interpreter lost track of the current node.');
        return;
      }
      if (++this.steps > this.options.maxSteps) {
        this.fail(
          `Stopped after ${this.options.maxSteps} steps. The flow probably loops without reaching an End node.`,
          nodeId
        );
        return;
      }
      await this.execute(nodeId, generation);
    }
  }

  private async execute(nodeId: string, generation: number) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      this.fail(`Node "${nodeId}" no longer exists.`);
      return;
    }

    switch (node.data.type) {
      case 'message': {
        const text = interpolate(node.data.message, this.variables);
        if (text.trim()) {
          this.emit({ type: 'botMessage', nodeId, text });
        } else {
          this.emit({
            type: 'system',
            nodeId,
            tone: 'warning',
            text: `Message node "${node.data.label}" has no text.`,
          });
        }
        await this.advance(nodeId, null, generation);
        return;
      }

      case 'input': {
        const data = node.data as InputNodeData;
        const prompt = interpolate(data.prompt, this.variables).trim();
        this.emit({
          type: 'botMessage',
          nodeId,
          text: prompt || `Please enter ${data.variableName || 'a value'}:`,
        });
        this.emit({
          type: 'waitingForInput',
          nodeId,
          inputType: data.inputType,
          variableName: data.variableName,
        });
        this.setStatus('waitingForInput');
        return;
      }

      case 'condition': {
        const data = node.data as ConditionNodeData;
        if (!data.variable.trim()) {
          this.emit({
            type: 'system',
            nodeId,
            tone: 'warning',
            text: `Condition "${data.label}" has no variable set; taking the False branch.`,
          });
          await this.advance(nodeId, 'false', generation);
          return;
        }
        const result = evaluateCondition(data, this.variables);
        const actual = resolvePath(this.variables, data.variable);
        const actualText = actual === undefined ? '(unset)' : JSON.stringify(formatValue(actual));
        const expectedText =
          data.operator === 'isEmpty' ? '' : ` ${JSON.stringify(interpolate(data.value, this.variables))}`;
        this.emit({
          type: 'system',
          nodeId,
          tone: 'info',
          text: `Condition "${data.label}": ${data.variable} = ${actualText} ${OPERATOR_LABELS[data.operator]}${expectedText} → ${result ? 'True' : 'False'}`,
        });
        await this.advance(nodeId, result ? 'true' : 'false', generation);
        return;
      }

      case 'apiCall': {
        const ok = await this.callApi(node.data as ApiCallNodeData, nodeId, generation);
        if (this.isStale(generation)) return;
        await this.advance(nodeId, ok ? 'success' : 'failure', generation);
        return;
      }

      case 'end': {
        const text = interpolate(node.data.endMessage, this.variables);
        if (text.trim()) {
          this.emit({ type: 'botMessage', nodeId, text });
        }
        this.finish(`Reached End node "${node.data.label}".`, nodeId);
        return;
      }

      default:
        this.fail(`Unknown node type "${String((node.data as { type: unknown }).type)}".`, nodeId);
    }
  }

  /** Perform the HTTP request for an API Call node. Returns true on success. */
  private async callApi(
    data: ApiCallNodeData,
    nodeId: string,
    generation: number
  ): Promise<boolean> {
    const url = interpolate(data.url, this.variables).trim();
    if (!url) {
      this.emit({
        type: 'system',
        nodeId,
        tone: 'error',
        text: `API Call "${data.label}" has no URL; taking the Failure branch.`,
      });
      return false;
    }

    let headers: Record<string, string> = {};
    const rawHeaders = interpolate(data.headers, this.variables).trim();
    if (rawHeaders) {
      try {
        const parsed: unknown = JSON.parse(rawHeaders);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('headers must be a JSON object');
        }
        headers = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)])
        );
      } catch (err) {
        this.emit({
          type: 'system',
          nodeId,
          tone: 'error',
          text: `API Call "${data.label}": headers are not valid JSON (${(err as Error).message}); taking the Failure branch.`,
        });
        return false;
      }
    }

    const rawBody = interpolate(data.body, this.variables).trim();
    const hasBody = data.method !== 'GET' && rawBody !== '';
    if (hasBody && !Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }

    this.emit({
      type: 'system',
      nodeId,
      tone: 'info',
      text: `Calling ${data.method} ${url}…`,
    });

    const fetchImpl = this.options.fetchImpl ?? globalThis.fetch;
    const controller = new AbortController();
    this.abortController = controller;
    const timer = setTimeout(() => controller.abort(), this.options.requestTimeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetchImpl(url, {
        method: data.method,
        headers,
        body: hasBody ? rawBody : undefined,
        signal: controller.signal,
      });
      if (this.isStale(generation)) return false;

      const text = await response.text();
      let payload: VariableValue = text;
      try {
        payload = text ? (JSON.parse(text) as VariableValue) : null;
      } catch {
        /* keep plain text */
      }

      const name = data.responseVariable.trim();
      if (name) {
        this.variables[name] = payload;
        this.emit({ type: 'variables', variables: this.getVariables() });
      }

      const elapsed = Date.now() - startedAt;
      if (response.ok) {
        this.emit({
          type: 'system',
          nodeId,
          tone: 'success',
          text: `${response.status} ${response.statusText || 'OK'} in ${elapsed} ms${name ? ` → stored in ${name}` : ''}`,
        });
        return true;
      }
      this.emit({
        type: 'system',
        nodeId,
        tone: 'error',
        text: `${response.status} ${response.statusText || 'Error'} in ${elapsed} ms; taking the Failure branch.`,
      });
      return false;
    } catch (err) {
      if (this.isStale(generation)) return false;
      const aborted = (err as Error).name === 'AbortError';
      this.emit({
        type: 'system',
        nodeId,
        tone: 'error',
        text: aborted
          ? `Request timed out after ${this.options.requestTimeoutMs} ms; taking the Failure branch.`
          : `Request failed: ${(err as Error).message}. (Browsers block cross-origin requests unless the server sends CORS headers.) Taking the Failure branch.`,
      });
      return false;
    } finally {
      clearTimeout(timer);
      if (this.abortController === controller) this.abortController = null;
    }
  }

  /**
   * Follow the outgoing edge from `nodeId` on `handle` (or the only edge when
   * `handle` is null). Finishes the run when no edge exists.
   */
  private async advance(
    nodeId: string,
    handle: string | null,
    generation: number
  ): Promise<boolean> {
    if (this.isStale(generation)) return false;

    const outgoing = this.edges.filter((e) => e.source === nodeId);
    const edge =
      handle === null
        ? outgoing[0]
        : outgoing.find((e) => (e.sourceHandle ?? 'default') === handle);

    if (!edge) {
      const node = this.nodes.get(nodeId);
      const branch = handle ? ` on its "${handle}" branch` : '';
      this.finish(`"${node?.data.label ?? nodeId}" has no outgoing connection${branch}.`, nodeId);
      return false;
    }

    if (!this.nodes.has(edge.target)) {
      this.fail(`Edge "${edge.id}" points to a missing node.`, nodeId);
      return false;
    }

    this.emit({ type: 'traverseEdge', edgeId: edge.id });
    await this.enter(edge.target, generation);
    return !this.isStale(generation);
  }
}
