import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { ITraitListOutcomesModel } from '../model/trait-list-outcomes-model';
import { IBigFivePersonalityTraitOutcomeModel } from '../model/big-five-outcomes-model';
import { IBigFivePersonalityTraitOutcomeModel as IBigFiveLayerOutcome } from '../model/assessment-outcome-model';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  green:      [80,  200, 120] as [number, number, number],  // #50C878
  greenDark:  [40,  150, 80]  as [number, number, number],
  dark:       [30,  30,  30]  as [number, number, number],
  mid:        [80,  80,  80]  as [number, number, number],
  muted:      [130, 130, 130] as [number, number, number],
  light:      [220, 220, 220] as [number, number, number],
  bg:         [245, 247, 250] as [number, number, number],
  white:      [255, 255, 255] as [number, number, number],
  redLight:   [255, 230, 230] as [number, number, number],
  red:        [200, 50,  50]  as [number, number, number],
  greenLight: [220, 245, 225] as [number, number, number],
};

// ─── Layout constants ────────────────────────────────────────────────────────
const PAGE_W   = 210;
const PAGE_H   = 297;
const MARGIN   = 14;
const COL_W    = (PAGE_W - MARGIN * 2 - 6) / 2;   // two-column width
const CONTENT_W = PAGE_W - MARGIN * 2;

@Injectable({ providedIn: 'root' })
export class AssessmentPdfService {

  async generate(
    traitList: ITraitListOutcomesModel | null,
    bigFive: IBigFivePersonalityTraitOutcomeModel | null,
    bigFiveLayer: IBigFiveLayerOutcome | null,
    userName?: string
  ): Promise<void> {
    const logoBase64 = await this.loadImageAsBase64('assets/images/ogmentor-logo.png').catch(() => null);

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    let y = 0;

    y = this.drawCover(doc, userName, logoBase64);
    y = this.drawLayer1(doc, traitList, y);

    doc.addPage();
    y = this.drawLayer2(doc, bigFive, bigFiveLayer, 14);
    this.drawFooterOnAllPages(doc, logoBase64);

    doc.save(`OpenKeyID-Assessment-${userName ?? 'Result'}.pdf`);
  }

  // ─── Cover / Header ────────────────────────────────────────────────────────
  private drawCover(doc: jsPDF, userName?: string, logoBase64?: string | null): number {
    // Dark header bar
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, PAGE_W, 42, 'F');

    doc.setTextColor(...C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('OpenKeyID', MARGIN, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Professional Identity Assessment', MARGIN, 19);

    if (userName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Report for: ${userName}`, MARGIN, 28);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor("#D4AF37");
    doc.text("Disclaimer: This assessment is designed as a tool for team building and development only. While it provides valuable insights, your self-perception"
      , MARGIN, 36);
    doc.text("is the ultimate authority. If any results do not resonate with your experience, please prioritize your own intuition and judgment."
      , MARGIN, 40);
       
    // Date top-right
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(dateStr, PAGE_W - MARGIN, 16, { align: 'right' });

    return 50;
  }

  // ─── Layer 1: Professional Mask ────────────────────────────────────────────
  private drawLayer1(doc: jsPDF, outcome: ITraitListOutcomesModel | null, startY: number): number {
    if (!outcome) return startY;
    let y = startY;

    y = this.drawLayerBanner(doc, y, 'LAYER 1', 'YOUR PROFESSIONAL MASK',
      'How you operate, execute, and survive in the workplace environment.');

    // ── Archetype hero card
    y = this.ensureSpace(doc, y, 36);
    doc.setFillColor(...C.white);
    doc.roundedRect(MARGIN, y, CONTENT_W, 34, 3, 3, 'F');
    doc.setDrawColor(...C.light);
    doc.roundedRect(MARGIN, y, CONTENT_W, 34, 3, 3, 'S');

    // green left accent
    doc.setFillColor(...C.green);
    doc.roundedRect(MARGIN, y, 4, 34, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...C.dark);
    doc.text((outcome.archetypeName ?? '').toUpperCase(), MARGIN + 10, y + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(`Primary: ${outcome.primaryAnimal}   |   Secondary: ${outcome.secondaryAnimal}`, MARGIN + 10, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...C.mid);
    const summaryLines = doc.splitTextToSize(outcome.executiveSummary ?? '', CONTENT_W - 16);
    doc.text(summaryLines.slice(0, 2), MARGIN + 10, y + 24);
    y += 40;

    // ── Strengths & Blind Spots (two columns)
    y = this.ensureSpace(doc, y, 10);
    const strengths = this.toArray(outcome.signatureStrengths);
    const blindSpots = this.toArray(outcome.operationalBlindSpots);

    // Calculate height needed per item (name line + description lines)
    const itemHeight = (items: any[]): number => items.reduce((acc, item) => {
      const descLines = item.description
        ? doc.splitTextToSize(item.description, COL_W - 10).length
        : 0;
      return acc + 8 + descLines * 4.5;
    }, 0);

    const strengthsH = 12 + itemHeight(strengths) + 6;
    const blindSpotsH = 12 + itemHeight(blindSpots) + 6;
    const colCardH = Math.max(strengthsH, blindSpotsH);

    y = this.ensureSpace(doc, y, colCardH + 4);

    // Strengths card
    doc.setFillColor(...C.greenLight);
    doc.roundedRect(MARGIN, y, COL_W, colCardH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.greenDark);
    doc.text('SIGNATURE STRENGTHS', MARGIN + 5, y + 8);
    let itemY = y + 15;
    strengths.forEach((s: any) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.dark);
      const nameLines = doc.splitTextToSize(`• ${s.name ?? s}`, COL_W - 8);
      doc.text(nameLines[0], MARGIN + 5, itemY);
      itemY += 5.5;
      if (s.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.muted);
        const descLines = doc.splitTextToSize(s.description, COL_W - 10);
        doc.text(descLines, MARGIN + 8, itemY);
        itemY += descLines.length * 4.5;
      }
      itemY += 2.5;
    });

    // Blind Spots card
    const col2X = MARGIN + COL_W + 6;
    doc.setFillColor(...C.redLight);
    doc.roundedRect(col2X, y, COL_W, colCardH, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.red);
    doc.text('OPERATIONAL BLIND SPOTS', col2X + 5, y + 8);
    itemY = y + 15;
    blindSpots.forEach((b: any) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.dark);
      const nameLines = doc.splitTextToSize(`• ${b.name ?? b}`, COL_W - 8);
      doc.text(nameLines[0], col2X + 5, itemY);
      itemY += 5.5;
      if (b.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.muted);
        const descLines = doc.splitTextToSize(b.description, COL_W - 10);
        doc.text(descLines, col2X + 8, itemY);
        itemY += descLines.length * 4.5;
      }
      itemY += 2.5;
    });

    y += colCardH + 8;

    // ── Operational Dynamics
    const dynItems = [
      { label: 'OPTIMAL WORK ENVIRONMENT', value: outcome.operationalDynamics?.optimalWorkEnvironment },
      { label: 'FRICTION MANAGEMENT',      value: outcome.operationalDynamics?.conflictAndMeetingStyle },
      { label: 'DELEGATION',               value: outcome.operationalDynamics?.delegationProfile },
    ].filter(d => d.value);

    if (dynItems.length) {
      y = this.ensureSpace(doc, y, 12);
      this.drawSectionLabel(doc, y, 'OPERATIONAL DYNAMICS');
      y += 7;

      dynItems.forEach(item => {
        const textLines = doc.splitTextToSize(item.value ?? '', CONTENT_W - 14);
        const cardH = 8 + textLines.length * 5 + 4;
        y = this.ensureSpace(doc, y, cardH);
        doc.setFillColor(...C.white);
        doc.setDrawColor(...C.light);
        doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.green);
        doc.text(item.label, MARGIN + 5, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.dark);
        doc.text(textLines, MARGIN + 5, y + 12);
        y += cardH + 4;
      });
    }

    // Friction Point
    if (outcome.operationalDynamics?.frictionPoint) {
      const fpLines = doc.splitTextToSize(outcome.operationalDynamics.frictionPoint, CONTENT_W - 14);
      const fpH = 10 + fpLines.length * 5 + 4;
      y = this.ensureSpace(doc, y, fpH);
      doc.setFillColor(255, 248, 220);
      doc.setDrawColor(200, 150, 0);
      doc.roundedRect(MARGIN, y, CONTENT_W, fpH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(160, 100, 0);
      doc.text('FRICTION POINT', MARGIN + 5, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.dark);
      doc.text(fpLines, MARGIN + 5, y + 13);
      y += fpH + 6;
    }

    // ── In Good Company
    const company = this.toArray(outcome.inGoodCompany);
    if (company.length) {
      y = this.ensureSpace(doc, y, 12);
      this.drawSectionLabel(doc, y, 'IN GOOD COMPANY');
      y += 7;

      company.forEach((person: any) => {
        const descLines = doc.splitTextToSize(person.description ?? '', CONTENT_W - 12);
        const personH = 20 + descLines.length * 5 + 8;
        y = this.ensureSpace(doc, y, personH);
        doc.setFillColor(...C.bg);
        doc.setDrawColor(...C.light);
        doc.roundedRect(MARGIN, y, CONTENT_W, personH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...C.dark);
        doc.text(person.name ?? '', MARGIN + 5, y + 8);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(...C.muted);
        doc.text(person.title ?? '', MARGIN + 5, y + 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.mid);
        doc.text(descLines, MARGIN + 5, y + 22);
        y += personH + 4;
      });
    }

    return y + 6;
  }

  // ─── Layer 2: Internal Engine ──────────────────────────────────────────────
  private drawLayer2(doc: jsPDF, outcome: IBigFivePersonalityTraitOutcomeModel | null, layerOutcome: IBigFiveLayerOutcome | null, startY: number): number {
    if (!outcome) return startY;
    let y = startY;

    y = this.drawLayerBanner(doc, y, 'LAYER 2', 'YOUR INTERNAL ENGINE',
      'The hardwired biological temperament that fuels your professional execution.');

    // ── Big Five bars
    y = this.ensureSpace(doc, y, 12);
    this.drawSectionLabel(doc, y, 'THE BIG FIVE BASELINE');
    y += 7;

    const bigFiveItems = [
      { label: 'OPENNESS',         pct: outcome.traitScores?.openness         ? this.scoreToPercent(outcome.traitScores.openness as string)         : null },
      { label: 'CONSCIENTIOUS',    pct: outcome.traitScores?.conscientiousness ? this.scoreToPercent(outcome.traitScores.conscientiousness as string) : null },
      { label: 'EXTRAVERSION',     pct: outcome.traitScores?.extraversion      ? this.scoreToPercent(outcome.traitScores.extraversion as string)      : null },
      { label: 'AGREEABLENESS',    pct: outcome.traitScores?.agreeableness     ? this.scoreToPercent(outcome.traitScores.agreeableness as string)     : null },
      { label: 'NEUROTICISM',      pct: outcome.traitScores?.neuroticism       ? this.scoreToPercent(outcome.traitScores.neuroticism as string)       : null },
    ];

    const percentileItems = [
      { label: 'OPENNESS',      val: layerOutcome?.opennesPercentile },
      { label: 'CONSCIENTIOUS', val: layerOutcome?.conscientiousnessPercentile },
      { label: 'EXTRAVERSION',  val: layerOutcome?.extraversionPercentile },
      { label: 'AGREEABLENESS', val: layerOutcome?.agreeablenessPercentile },
      { label: 'NEUROTICISM',   val: layerOutcome?.neuroticismPercentile },
    ].filter(p => p.val != null);

    if (percentileItems.length) {
      y = this.ensureSpace(doc, y, 28);
      const barW = CONTENT_W / percentileItems.length;
      const barMaxH = 20;

      percentileItems.forEach((item, i) => {
        const x = MARGIN + i * barW;
        const pct = Math.min(100, Math.max(0, item.val ?? 0));
        const fillH = (pct / 100) * barMaxH;

        // Track
        doc.setFillColor(...C.light);
        doc.roundedRect(x + barW * 0.25, y, barW * 0.5, barMaxH, 2, 2, 'F');

        // Fill
        const [r, g, b] = pct >= 70 ? C.green : pct >= 40 ? [90, 150, 220] as [number,number,number] : C.muted;
        doc.setFillColor(r, g, b);
        doc.roundedRect(x + barW * 0.25, y + (barMaxH - fillH), barW * 0.5, fillH, 2, 2, 'F');

        // Percent label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.dark);
        doc.text(`${pct}%`, x + barW / 2, y + barMaxH + 5, { align: 'center' });

        // Trait label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...C.muted);
        doc.text(item.label, x + barW / 2, y + barMaxH + 10, { align: 'center' });
      });

      y += barMaxH + 14;
    } else {
      // Fallback: show trait score labels
      bigFiveItems.forEach(item => {
        if (!item.label) return;
        y = this.ensureSpace(doc, y, 8);
        doc.setFillColor(...C.bg);
        doc.setDrawColor(...C.light);
        doc.roundedRect(MARGIN, y, CONTENT_W, 7, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...C.dark);
        doc.text(item.label, MARGIN + 4, y + 5);
        y += 9;
      });
    }

    // OCEAN Profile
    if (outcome.oceanProfile) {
      y = this.ensureSpace(doc, y, 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.muted);
      doc.text(`OCEAN PROFILE: `, MARGIN, y + 5);
      doc.setTextColor(...C.green);
      doc.text(String(outcome.oceanProfile), MARGIN + 30, y + 5);
      y += 10;
    }

    // ── Cognitive & Behavioral Synthesis
    const synthItems = [
      { label: 'INFLUENCE ENGINE',     value: outcome.synthesizedDynamics?.influenceEngine },
      { label: 'INFO PROCESSING STYLE',value: outcome.synthesizedDynamics?.infoProcessingStyle },
      { label: 'DECISION VELOCITY',    value: outcome.synthesizedDynamics?.decisionVelocity },
      { label: 'FEEDBACK RECEPTIVITY', value: outcome.synthesizedDynamics?.feedbackReceptivity },
      { label: 'RISK TOLERANCE',       value: outcome.synthesizedDynamics?.riskTolerance },
    ].filter(s => s.value);

    if (synthItems.length) {
      y = this.ensureSpace(doc, y, 12);
      this.drawSectionLabel(doc, y, 'COGNITIVE & BEHAVIORAL SYNTHESIS');
      y += 7;

      // Two column grid
      const half = Math.ceil(synthItems.length / 2);
      for (let i = 0; i < synthItems.length; i++) {
        const item = synthItems[i];
        const isLeft = i % 2 === 0;
        const col2X = MARGIN + COL_W + 6;
        const xPos = isLeft ? MARGIN : col2X;

        if (isLeft) {
          const textLines = doc.splitTextToSize(item.value ?? '', COL_W - 10);
          const cardH = 10 + textLines.length * 5 + 4;

          // Peek at right-side partner
          const right = synthItems[i + 1];
          const rightLines = right ? doc.splitTextToSize(right.value ?? '', COL_W - 10) : [];
          const rightH = right ? (10 + rightLines.length * 5 + 4) : 0;
          const rowH = Math.max(cardH, rightH);

          y = this.ensureSpace(doc, y, rowH);

          // Left card
          doc.setFillColor(...C.white);
          doc.setDrawColor(...C.light);
          doc.roundedRect(MARGIN, y, COL_W, rowH, 2, 2, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...C.green);
          doc.text(item.label, MARGIN + 5, y + 7);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...C.dark);
          doc.text(textLines, MARGIN + 5, y + 13);

          // Right card
          if (right) {
            doc.setFillColor(...C.white);
            doc.setDrawColor(...C.light);
            doc.roundedRect(col2X, y, COL_W, rowH, 2, 2, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(...C.green);
            doc.text(right.label, col2X + 5, y + 7);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(...C.dark);
            doc.text(rightLines, col2X + 5, y + 13);
          }

          y += rowH + 4;
        }
      }
    }

    // ── Core Baselines
    const baselineItems = [
      { label: 'ENERGY BATTERY',         value: outcome.coreBaselines?.energyBattery },
      { label: 'EXECUTION & WORK ETHIC', value: outcome.coreBaselines?.executionAndWorkEthic },
      { label: 'TRUST BASELINE',         value: outcome.coreBaselines?.trustBaseline },
      { label: 'STRESS BASELINE',        value: outcome.coreBaselines?.stressBaseline },
    ].filter(b => b.value);

    if (baselineItems.length) {
      y = this.ensureSpace(doc, y, 12);
      this.drawSectionLabel(doc, y, 'CORE BASELINES');
      y += 7;

      baselineItems.forEach(item => {
        const textLines = doc.splitTextToSize(item.value ?? '', CONTENT_W - 14);
        const cardH = 8 + textLines.length * 5 + 4;
        y = this.ensureSpace(doc, y, cardH);
        doc.setFillColor(...C.bg);
        doc.setDrawColor(...C.light);
        doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.green);
        doc.text(item.label, MARGIN + 5, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.dark);
        doc.text(textLines, MARGIN + 5, y + 12);
        y += cardH + 4;
      });
    }

    // ── Toxic Trigger + Ideal Manager
    const triggerVal = outcome.environmentalFit?.toxicEnvironmentTrigger;
    const managerVal = outcome.environmentalFit?.idealManagerProfile;

    if (triggerVal || managerVal) {
      const triggerLines = triggerVal ? doc.splitTextToSize(triggerVal, COL_W - 10) : [];
      const managerLines = managerVal ? doc.splitTextToSize(managerVal, COL_W - 10) : [];
      const rowH = Math.max(
        triggerLines.length * 5 + 18,
        managerLines.length * 5 + 18
      );

      y = this.ensureSpace(doc, y, rowH + 8);
      this.drawSectionLabel(doc, y, 'ENVIRONMENTAL FIT');
      y += 7;

      // Toxic Trigger
      if (triggerVal) {
        doc.setFillColor(...C.redLight);
        doc.setDrawColor(...C.red);
        doc.roundedRect(MARGIN, y, COL_W, rowH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...C.red);
        doc.text('THE TOXIC TRIGGER', MARGIN + 5, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.muted);
        doc.text('ENVIRONMENT TO AVOID', MARGIN + 5, y + 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.dark);
        doc.text(triggerLines, MARGIN + 5, y + 19);
      }

      // Ideal Manager
      if (managerVal) {
        const col2X = MARGIN + COL_W + 6;
        doc.setFillColor(...C.greenLight);
        doc.setDrawColor(...C.green);
        doc.roundedRect(col2X, y, COL_W, rowH, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...C.greenDark);
        doc.text('IDEAL MANAGER PROFILE', col2X + 5, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.muted);
        doc.text('LEADERSHIP SYNERGY', col2X + 5, y + 13);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.dark);
        doc.text(managerLines, col2X + 5, y + 19);
      }

      y += rowH + 6;
    }

    // ── Ideal Subordinate Profile (full width)
    const subordinateVal = outcome.environmentalFit?.idealSubordinateProfile;
    if (subordinateVal) {
      const subLines = doc.splitTextToSize(subordinateVal, CONTENT_W - 14);
      const subH = 10 + subLines.length * 5 + 8;
      y = this.ensureSpace(doc, y, subH);
      doc.setFillColor(...C.white);
      doc.setDrawColor(...C.light);
      doc.roundedRect(MARGIN, y, CONTENT_W, subH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.greenDark);
      doc.text('IDEAL SUBORDINATE PROFILE', MARGIN + 5, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.muted);
      doc.text('TEAM SYNERGY', MARGIN + 5, y + 13);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.dark);
      doc.text(subLines, MARGIN + 5, y + 19);
      y += subH + 6;
    }

    return y;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private drawLayerBanner(
    doc: jsPDF, y: number,
    layer: string, title: string, subtitle: string
  ): number {
    y = this.ensureSpace(doc, y, 20);
    doc.setFillColor(...C.green);
    doc.rect(0, y - 2, PAGE_W, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...C.dark);
    doc.text(`${layer}: `, MARGIN, y + 8);

    const layerW = doc.getTextWidth(`${layer}: `);
    doc.setTextColor(...C.white);
    doc.text(title, MARGIN + layerW, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.dark);
    doc.text(subtitle, MARGIN, y + 15);

    return y + 26;
  }

  private drawSectionLabel(doc: jsPDF, y: number, label: string): void {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    doc.text(label, MARGIN, y + 4);
    doc.setDrawColor(...C.light);
    doc.line(MARGIN + doc.getTextWidth(label) + 3, y + 3, PAGE_W - MARGIN, y + 3);
  }

  private drawFooterOnAllPages(doc: jsPDF, logoBase64?: string | null): void {
    const FOOTER_H = 14;
    const LOGO_W   = 27;   // 1800/800 ≈ 2.25 ratio → 27×12
    const LOGO_H   = 12;
    const total = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFillColor(240, 240, 240);
      doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F');

      if (logoBase64) {
        const logoX = (PAGE_W - LOGO_W) / 2;
        const logoY = PAGE_H - FOOTER_H + (FOOTER_H - LOGO_H) / 2;
        doc.addImage(logoBase64, 'PNG', logoX, logoY, LOGO_W, LOGO_H);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...C.muted);
      doc.text('Professional Identity Assessment', MARGIN, PAGE_H - 3);
      doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, PAGE_H - 3, { align: 'right' });
    }
  }

  /** Add a new page if remaining space is insufficient */
  private ensureSpace(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > PAGE_H - 16) {
      doc.addPage();
      return 14;
    }
    return y;
  }

  private toArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  }

  private loadImageAsBase64(url: string): Promise<string> {
    return fetch(url)
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
  }

  private scoreToPercent(score: string): number {
    const map: Record<string, number> = {
      very_low: 10, low: 25, below_average: 38,
      average: 50, above_average: 65, high: 78, very_high: 92
    };
    return map[score?.toLowerCase()] ?? 50;
  }
}
