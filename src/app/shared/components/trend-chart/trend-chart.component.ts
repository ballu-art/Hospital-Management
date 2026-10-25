import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ChartSeries {
  readonly name: string;
  readonly values: readonly number[];
}

const W = 640;
const H = 300;
const M = { top: 16, right: 16, bottom: 56, left: 56 };

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = [1, 2, 5, 10].find((s) => s * magnitude >= value / 5) ?? 10;
  return Math.ceil(value / (step * magnitude)) * step * magnitude;
}

/**
 * Dependency-free SVG line/bar chart. The only place that knows how charts are drawn, so a
 * charting library could replace it without touching the pages that use it.
 * Accessibility: the SVG is labelled with a text summary and the data is also exposed as a
 * visually hidden table.
 */
@Component({
  selector: 'app-trend-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <figcaption>{{ title() }}</figcaption>
      <svg [attr.viewBox]="'0 0 ' + w + ' ' + h" role="img" [attr.aria-label]="summaryText()">
        @for (t of yTicks(); track t.value) {
          <line
            class="grid"
            [attr.x1]="m.left"
            [attr.x2]="w - m.right"
            [attr.y1]="t.y"
            [attr.y2]="t.y"
          />
          <text class="tick" [attr.x]="m.left - 8" [attr.y]="t.y + 4" text-anchor="end">
            {{ t.value }}
          </text>
        }
        @for (t of xTicks(); track $index) {
          <text class="tick" [attr.x]="t.x" [attr.y]="h - m.bottom + 18" text-anchor="middle">
            {{ t.label }}
          </text>
        }
        <line
          class="axis"
          [attr.x1]="m.left"
          [attr.x2]="m.left"
          [attr.y1]="m.top"
          [attr.y2]="h - m.bottom"
        />
        <line
          class="axis"
          [attr.x1]="m.left"
          [attr.x2]="w - m.right"
          [attr.y1]="h - m.bottom"
          [attr.y2]="h - m.bottom"
        />
        @if (type() === 'line') {
          @for (s of lines(); track s.name) {
            <path [class]="'line s' + s.index" [attr.d]="s.path" />
            @for (p of s.points; track $index) {
              <circle [class]="'dot s' + s.index" [attr.cx]="p.x" [attr.cy]="p.y" r="4" />
            }
          }
        } @else {
          @for (b of bars(); track $index) {
            <rect
              [class]="'bar s' + b.index"
              [attr.x]="b.x"
              [attr.y]="b.y"
              [attr.width]="b.width"
              [attr.height]="b.height"
            />
          }
        }
        <text
          class="axis-label"
          [attr.x]="(w + m.left - m.right) / 2"
          [attr.y]="h - 8"
          text-anchor="middle"
        >
          {{ xLabel() }}
        </text>
        <text
          class="axis-label"
          [attr.transform]="'translate(14 ' + (h - m.bottom + m.top) / 2 + ') rotate(-90)'"
          text-anchor="middle"
        >
          {{ yLabel() }}
        </text>
      </svg>
      @if (series().length > 1) {
        <ul class="legend">
          @for (s of series(); track s.name; let i = $index) {
            <li><span [class]="'swatch s' + i"></span>{{ s.name }}</li>
          }
        </ul>
      }
      <table class="visually-hidden">
        <caption>
          {{
            title()
          }}
          data
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ xLabel() }}</th>
            @for (s of series(); track s.name) {
              <th scope="col">{{ s.name }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (l of labels(); track $index; let i = $index) {
            <tr>
              <th scope="row">{{ l }}</th>
              @for (s of series(); track s.name) {
                <td>{{ s.values[i] }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    </figure>
  `,
  styles: `
    figure {
      margin: 0;
    }
    figcaption {
      font-weight: 500;
      margin-bottom: var(--app-space-2);
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .grid {
      stroke: var(--app-color-border);
      stroke-width: 1;
    }
    .axis {
      stroke: var(--app-color-text-muted);
      stroke-width: 1;
    }
    .tick,
    .axis-label {
      fill: var(--app-color-text-muted);
      font-size: 12px;
    }
    .line {
      fill: none;
      stroke-width: 2.5;
    }
    .s0 {
      stroke: var(--app-chart-1);
      fill: var(--app-chart-1);
    }
    .s1 {
      stroke: var(--app-chart-2);
      fill: var(--app-chart-2);
    }
    .s2 {
      stroke: var(--app-chart-3);
      fill: var(--app-chart-3);
    }
    .line.s0,
    .line.s1,
    .line.s2 {
      fill: none;
    }
    .line.s1 {
      stroke-dasharray: 6 4;
    }
    .line.s2 {
      stroke-dasharray: 2 4;
    }
    .bar {
      stroke: none;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-4);
      list-style: none;
      padding: 0;
      margin: var(--app-space-2) 0 0;
      font-size: var(--app-font-size-sm);
    }
    .swatch {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 2px;
      margin-right: var(--app-space-2);
    }
    .swatch.s0 {
      background: var(--app-chart-1);
    }
    .swatch.s1 {
      background: var(--app-chart-2);
    }
    .swatch.s2 {
      background: var(--app-chart-3);
    }
  `,
})
export class TrendChartComponent {
  readonly title = input.required<string>();
  readonly type = input<'line' | 'bar'>('line');
  readonly labels = input.required<readonly string[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly xLabel = input.required<string>();
  readonly yLabel = input.required<string>();
  /** Optional override for the accessible summary. */
  readonly summary = input<string>('');

  protected readonly w = W;
  protected readonly h = H;
  protected readonly m = M;

  private readonly yMax = computed(() =>
    niceMax(Math.max(0, ...this.series().flatMap((s) => s.values))),
  );
  private readonly plotW = W - M.left - M.right;
  private readonly plotH = H - M.top - M.bottom;
  private readonly y = (v: number): number => M.top + this.plotH - (v / this.yMax()) * this.plotH;
  private readonly slot = computed(() => this.plotW / Math.max(1, this.labels().length));
  private readonly cx = (i: number): number => M.left + this.slot() * (i + 0.5);

  protected readonly yTicks = computed(() =>
    Array.from({ length: 5 }, (_, i) => {
      const value = (this.yMax() / 4) * i;
      return { value: Math.round(value * 10) / 10, y: this.y(value) };
    }),
  );
  protected readonly xTicks = computed(() =>
    this.labels().map((label, i) => ({ label, x: this.cx(i) })),
  );
  protected readonly lines = computed(() =>
    this.series().map((s, index) => {
      const points = s.values.map((v, i) => ({ x: this.cx(i), y: this.y(v) }));
      return {
        name: s.name,
        index,
        points,
        path: points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '),
      };
    }),
  );
  protected readonly bars = computed(() => {
    const count = Math.max(1, this.series().length);
    const groupW = this.slot() * 0.7;
    const barW = groupW / count;
    return this.series().flatMap((s, index) =>
      s.values.map((v, i) => ({
        index,
        x: this.cx(i) - groupW / 2 + index * barW,
        y: this.y(v),
        width: Math.max(1, barW - 2),
        height: M.top + this.plotH - this.y(v),
      })),
    );
  });
  protected readonly summaryText = computed(
    () =>
      this.summary() ||
      `${this.title()}. ` +
        this.series()
          .map(
            (s) =>
              `${s.name}: ${this.labels()
                .map((l, i) => `${l} ${String(s.values[i])}`)
                .join(', ')}.`,
          )
          .join(' '),
  );
}
