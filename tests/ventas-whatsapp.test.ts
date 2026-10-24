import { describe, expect, it } from 'vitest';
import { BLOCK_ORDER, QUESTIONS, type Answers } from '../src/lib/ventas-whatsapp/questions';
import { bandFor, computeResult, isValidAnswers, topPriorities } from '../src/lib/ventas-whatsapp/scoring';
import { AGENDA_FORM } from '../src/data/agenda-form';

const all = (v: string): Answers => Object.fromEntries(QUESTIONS.map((q) => [q.id, v])) as Answers;
const set = (base: Answers, ch: Record<string, string>): Answers => ({ ...base, ...ch }) as Answers;

describe('preguntas', () => {
  it('12 preguntas en 4 áreas de 3', () => {
    expect(QUESTIONS).toHaveLength(12);
    expect(BLOCK_ORDER.map((b) => QUESTIONS.filter((q) => q.block === b).length)).toEqual([3, 3, 3, 3]);
  });
  it('rechaza "No aplica", opciones inventadas y preguntas inexistentes', () => {
    expect(isValidAnswers({ q1: 'si', q12: 'no-se' })).toBe(true);
    expect(isValidAnswers({ q1: 'na' })).toBe(false);
    expect(isValidAnswers({ q1: 'quizas' })).toBe(false);
    expect(isValidAnswers({ q13: 'si' })).toBe(false);
  });
});

describe('puntaje', () => {
  it('todo Sí → 100; todo Parcial → 50; todo No → 0', () => {
    expect(computeResult(all('si')).score).toBe(100);
    expect(computeResult(all('parcial')).score).toBe(50);
    expect(computeResult(all('no')).score).toBe(0);
    expect(computeResult(all('si')).complete).toBe(true);
  });
  it('score = round(puntos / 24 × 100), áreas sobre 100 y la más débil', () => {
    const r = computeResult(set(all('si'), { q4: 'no', q5: 'no', q6: 'parcial' })); // 19/24 → 79
    expect(r.score).toBe(79);
    expect(r.blocks.find((b) => b.id === 'seguimiento')!.score).toBe(17);
    expect(r.weakest!.id).toBe('seguimiento');
    expect(r.band.id).toBe('ordenado');
  });
  it('"No sé" vale 0 y queda pendiente de verificar', () => {
    const r = computeResult(set(all('si'), { q8: 'no-se' }));
    expect(r.score).toBe(92);
    expect(r.unverifiedQuestions).toEqual(['q8']);
  });
  it('rangos', () => {
    expect(bandFor(0).id).toBe('fugas');
    expect(bandFor(49).id).toBe('reactiva');
    expect(bandFor(50).id).toBe('construccion');
    expect(bandFor(75).id).toBe('ordenado');
  });
});

describe('prioridades', () => {
  it('No antes que Parcial y en orden de dependencia, máximo 3', () => {
    const p = topPriorities(set(all('si'), { q1: 'parcial', q7: 'no', q11: 'no', q6: 'no' }));
    expect(p.map((x) => x.id)).toEqual(['crm', 'cotizacion', 'recordatorios']);
    expect(p.every((x) => x.kind === 'gap')).toBe(true);
  });
  it('todo No → contestar, celular compartido y seguimiento primero', () => {
    expect(topPriorities(all('no')).map((x) => x.id)).toEqual(['respuesta', 'responsable', 'seguimiento']);
  });
  it('"No sé" pide verificar; todo Sí propone mantener sin inventar fallas', () => {
    const v = topPriorities(set(all('si'), { q8: 'no-se' }));
    expect(v[0]).toMatchObject({ id: 'medicion', kind: 'verify' });
    expect(v[0].title.startsWith('Verifica:')).toBe(true);
    const k = topPriorities(all('si'));
    expect(k).toHaveLength(3);
    expect(k.every((x) => x.kind === 'keep')).toBe(true);
  });
});

describe('formulario de agenda', () => {
  it('solo nombre del negocio, volumen y qué resolver primero', () => {
    const c = AGENDA_FORM.atencion;
    expect(Object.keys(c).sort()).toEqual(['focus', 'focusLabel', 'nameLabel', 'volumeLabel', 'volumes']);
    expect(Object.keys(c.focus)).toHaveLength(4);
  });
});
