import { Injectable } from '@angular/core';

export type Band = 'ideal' | 'strong' | 'workable' | 'friction';
export interface Family {
  key: string; name: string; stone: string; color: string;
  role: 'driver' | 'executor'; offers: string; need: string; blind: string;
}
export interface ArchLite { name: string; p: string; s: string; imageUrl: string; }
export type Rec = { ideal: string[]; strong: string[]; friction: string[] };

/**
 * Client–Assistant personality matching logic (v1).
 * Complementary-fit model: the strongest assistant covers the client's blind spots.
 * Scoring blends both gems — 3×(primary↔primary) + (primary↔secondary) + (secondary↔primary) + ½(secondary↔secondary).
 * Ratings are directional (client → assistant), not symmetric.
 */
@Injectable({ providedIn: 'root' })
export class MatchingService {
  readonly order = ['INFLUENCE', 'SOCIABILITY', 'INTENSITY', 'ABSTRACTION', 'PRECISION', 'CONSISTENCY', 'PROSOCIAL', 'EMOTIONAL_RESONANCE'];
  readonly drivers = ['INFLUENCE', 'SOCIABILITY', 'INTENSITY', 'ABSTRACTION'];
  readonly executors = ['PRECISION', 'CONSISTENCY', 'PROSOCIAL', 'EMOTIONAL_RESONANCE'];

  readonly fam: Record<string, Family> = {
    INFLUENCE: { key: 'INFLUENCE', name: 'Commander', stone: 'Citrine', color: '#f4b23e', role: 'driver', offers: 'decisive drive, crisis command, and ownership of outcomes', need: 'flawless follow-through on the process and detail they skip', blind: 'impatience with process, steamrolling consensus' },
    SOCIABILITY: { key: 'SOCIABILITY', name: 'Inspirer', stone: 'Aquamarine', color: '#5ec8c8', role: 'driver', offers: 'team energy, morale, and relational glue', need: 'someone to hold the line on tasks and detail while they work the room', blind: 'distractibility, prioritizing being liked over hard truths' },
    INTENSITY: { key: 'INTENSITY', name: 'Catalyst', stone: 'Topaz', color: '#e8a13c', role: 'driver', offers: 'velocity, rapid prototyping, and relentless momentum', need: 'a structural integrator to turn fast ideas into shippable systems', blind: 'burnout, acting before planning, operational instability' },
    ABSTRACTION: { key: 'ABSTRACTION', name: 'Visionary', stone: 'Garnet', color: '#b5484a', role: 'driver', offers: 'strategic foresight, contingency planning, and clever pathfinding', need: 'daily-operations ownership they get bored maintaining', blind: 'detachment from daily ops, bored by maintenance' },
    PRECISION: { key: 'PRECISION', name: 'Analyzer', stone: 'Amethyst', color: '#9b6fce', role: 'executor', offers: 'rigorous detail, data validation, and quality control', need: 'warmth and people-read to offset a low-empathy default', blind: 'analysis paralysis, empathy void' },
    CONSISTENCY: { key: 'CONSISTENCY', name: 'Stabilizer', stone: 'Tourmaline', color: '#4a9d7a', role: 'executor', offers: 'operational bedrock, reliable systems, and follow-through', need: 'a spark of initiative and change they are slow to start', blind: 'slow to initiate, resistance to change' },
    PROSOCIAL: { key: 'PROSOCIAL', name: 'Counselor', stone: 'Opal', color: '#7fb0e0', role: 'executor', offers: 'empathy, loyalty, and conflict mediation', need: 'structure and boundaries they will not enforce for themselves', blind: 'self-sacrifice, weak boundaries' },
    EMOTIONAL_RESONANCE: { key: 'EMOTIONAL_RESONANCE', name: 'Intuitive', stone: 'Onyx', color: '#8892a6', role: 'executor', offers: 'instinctive people-read and quiet, high-trust anticipation', need: 'grounding structure to steady their moods and focus', blind: 'moodiness, alienation from corporate reality' },
  };
  readonly rec: Record<string, Rec> = {
    INFLUENCE: { ideal: ['PRECISION'], strong: ['CONSISTENCY', 'PROSOCIAL'], friction: ['INFLUENCE', 'INTENSITY', 'ABSTRACTION'] },
    SOCIABILITY: { ideal: ['PRECISION'], strong: ['CONSISTENCY', 'EMOTIONAL_RESONANCE'], friction: ['INFLUENCE', 'INTENSITY'] },
    INTENSITY: { ideal: ['CONSISTENCY'], strong: ['PRECISION', 'PROSOCIAL'], friction: ['INTENSITY', 'SOCIABILITY'] },
    ABSTRACTION: { ideal: ['CONSISTENCY'], strong: ['PRECISION', 'PROSOCIAL'], friction: ['ABSTRACTION', 'INTENSITY'] },
    PRECISION: { ideal: ['CONSISTENCY'], strong: ['PROSOCIAL', 'ABSTRACTION'], friction: ['EMOTIONAL_RESONANCE', 'SOCIABILITY'] },
    CONSISTENCY: { ideal: ['PRECISION'], strong: ['PROSOCIAL', 'SOCIABILITY'], friction: ['INTENSITY', 'INFLUENCE', 'ABSTRACTION'] },
    PROSOCIAL: { ideal: ['PRECISION'], strong: ['CONSISTENCY', 'INFLUENCE'], friction: ['PROSOCIAL', 'EMOTIONAL_RESONANCE'] },
    EMOTIONAL_RESONANCE: { ideal: ['CONSISTENCY'], strong: ['PRECISION', 'PROSOCIAL'], friction: ['INTENSITY', 'INFLUENCE'] },
  };

  comp(ct: string, at: string): number {
    if (ct === 'NONE' || at === 'NONE') return 0;
    const r = this.rec[ct]; if (!r) return 0;
    if (r.ideal.includes(at)) return 2;
    if (r.strong.includes(at)) return 1;
    if (r.friction.includes(at)) return -2;
    return 0;
  }
  score(c: ArchLite, a: ArchLite): number {
    let t = 3 * this.comp(c.p, a.p);
    if (a.s !== 'NONE') t += this.comp(c.p, a.s);
    if (c.s !== 'NONE') t += this.comp(c.s, a.p);
    if (c.s !== 'NONE' && a.s !== 'NONE') t += 0.5 * this.comp(c.s, a.s);
    return t;
  }
  band(t: number): Band { return t >= 5 ? 'ideal' : t >= 2 ? 'strong' : t > -2 ? 'workable' : 'friction'; }
  label(b: string): string { return b.charAt(0).toUpperCase() + b.slice(1); }
  stoneStr(a: ArchLite): string { return this.fam[a.p].stone + (a.s !== 'NONE' ? ' + ' + this.fam[a.s].stone : ' · Apex'); }

  famVerdict(cp: string, ap: string, v: number): string {
    const C = this.fam[cp], A = this.fam[ap];
    if (cp === ap) {
      return v < 0
        ? `Two ${A.name}s share the same blind spot (${C.blind}), so neither covers the gap.`
        : `Shared ${A.name} instincts click fast, but they also share a blind spot (${C.blind}).`;
    }
    if (v >= 2) return `${A.name} (${A.stone}) covers exactly what a ${C.name} lacks — ${A.offers}.`;
    if (v >= 1) return `${A.name} (${A.stone}) gives solid coverage of a ${C.name} need for ${C.need}.`;
    if (v <= -2) return (C.role === A.role && A.role === 'driver')
      ? `Two drivers — ${C.name} and ${A.name} — contest direction instead of dividing labour.`
      : `${A.name} style pulls against a ${C.name} here (${C.blind} meets ${A.blind}).`;
    return `Neutral fit — ${A.name} does not fully cover a ${C.name} need for ${C.need}.`;
  }
  /** Full reason for a client → assistant pairing, blending the secondary gems. */
  reason(c: ArchLite, a: ArchLite): string {
    let out = this.famVerdict(c.p, a.p, this.comp(c.p, a.p));
    const mods: string[] = [];
    if (a.s !== 'NONE') {
      const v = this.comp(c.p, a.s);
      if (v > 0) mods.push(`its ${this.fam[a.s].stone} side deepens the fit`);
      else if (v < 0) mods.push(`its ${this.fam[a.s].stone} side adds friction`);
    }
    if (c.s !== 'NONE') {
      const v2 = this.comp(c.s, a.p);
      if (v2 > 0) mods.push(`and it suits the client ${this.fam[c.s].name} secondary`);
      else if (v2 < 0) mods.push(`but rubs the client ${this.fam[c.s].name} secondary`);
    }
    if (mods.length) out += ' ' + mods.join(', ') + '.';
    return out;
  }

  // Family-level (Layer 1 grid)
  famRate(ck: string, ak: string): Band { return this.band(3 * this.comp(ck, ak)); }
  famReason(ck: string, ak: string): string { return this.famVerdict(ck, ak, this.comp(ck, ak)); }

  recNames(k: string, kind: keyof Rec): string {
    return this.rec[k][kind].map((x) => `${this.fam[x].name} (${this.fam[x].stone})`).join(', ');
  }

  /** Rank every archetype against `me` in one direction. asClient=true → `me` is the client, results are assistants. */
  rank(me: ArchLite, all: ArchLite[], asClient: boolean): { a: ArchLite; band: Band; reason: string }[] {
    const rows = all.map((x) => {
      const t = asClient ? this.score(me, x) : this.score(x, me);
      const reason = asClient ? this.reason(me, x) : this.reason(x, me);
      return { a: x, band: this.band(t), reason };
    });
    const ord: Record<string, number> = { ideal: 0, strong: 1, workable: 2, friction: 3 };
    rows.sort((x, y) => ord[x.band] - ord[y.band] || x.a.name.localeCompare(y.a.name));
    return rows;
  }
}
