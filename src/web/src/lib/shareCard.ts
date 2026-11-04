export type ShareCardInput = {
  text: string;
  targetLabel: string;
  riskLevel: 'dusuk' | 'orta' | 'yuksek';
};

export type ShareCardModel = {
  width: number;
  height: number;
  lines: string[];
  targetLabel: string;
  riskLabel: string;
  riskColor: string;
  footer: string;
};

const RISK_LABEL = { dusuk: 'DÜŞÜK RİSK', orta: 'ORTA RİSK', yuksek: 'YÜKSEK RİSK' } as const;
const RISK_COLOR = { dusuk: '#3FA45B', orta: '#E8A33D', yuksek: '#D64545' } as const;

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    while (current.length > maxChars) {
      lines.push(current.slice(0, maxChars));
      current = current.slice(maxChars);
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]!.slice(0, maxChars - 1)}…`;
    return kept;
  }
  return lines;
}

export function buildShareCardModel(input: ShareCardInput): ShareCardModel {
  return {
    width: 1080,
    height: 1350,
    lines: wrap(input.text, 34, 12),
    targetLabel: input.targetLabel,
    riskLabel: RISK_LABEL[input.riskLevel],
    riskColor: RISK_COLOR[input.riskLevel],
    footer: 'Yalan Makinası · eğlence amaçlıdır',
  };
}

export function drawShareCard(ctx: CanvasRenderingContext2D, model: ShareCardModel): void {
  const { width, height } = model;

  ctx.fillStyle = '#0B0B0D';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#FFFFFF14';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.fillStyle = '#E8A33D';
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('YALAN MAKİNASI', 96, 110);

  ctx.fillStyle = '#8B867E';
  ctx.font = '400 24px "Inter", sans-serif';
  ctx.fillText(model.targetLabel.toUpperCase(), 96, 156);

  ctx.fillStyle = '#F2EFE9';
  ctx.font = '500 58px "Inter", sans-serif';
  let y = 300;
  for (const line of model.lines) {
    ctx.fillText(line, 96, y);
    y += 82;
  }

  ctx.fillStyle = model.riskColor;
  ctx.font = '600 28px "JetBrains Mono", monospace';
  ctx.fillText(model.riskLabel, 96, height - 220);

  ctx.fillStyle = '#6F6A63';
  ctx.font = '400 24px "Inter", sans-serif';
  ctx.fillText(model.footer, 96, height - 140);
}

export async function downloadShareCard(input: ShareCardInput, targetLabel: string): Promise<void> {
  const model = buildShareCardModel({ ...input, targetLabel });
  const canvas = document.createElement('canvas');
  canvas.width = model.width;
  canvas.height = model.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawShareCard(ctx, model);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'yalan-makinasi.png';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
