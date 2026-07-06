import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const LOGO_PATH = path.join(process.cwd(), "assets", "logo-sgm.png");
const FONT_PATH = path.join(process.cwd(), "assets", "fonts", "Cinzel-Bold.woff2");

const GOLD = "#e6c675";

function escapeXml(text: string) {
  return text.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

// Ancho medio de un glyph en mayúsculas de Cinzel Bold, como fracción del
// font-size — estimado a ojo (más ancho que una sans-serif normal).
const AVG_CHAR_WIDTH_EM = 0.68;
const LETTER_SPACING_EM = 0.03;

/** Envuelve el título en líneas que quepan en availableWidth a un font-size dado. */
function wrapAtFontSize(words: string[], fontSize: number, availableWidth: number): string[] {
  const charWidth = fontSize * (AVG_CHAR_WIDTH_EM + LETTER_SPACING_EM);
  const maxChars = Math.max(1, Math.floor(availableWidth / charWidth));

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  return lines;
}

/**
 * Prueba tamaños de fuente decrecientes hasta que el título quepa en 3
 * líneas o menos dentro del ancho disponible.
 */
function fitTitle(title: string, width: number) {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  const availableWidth = width * 0.84; // 8% de margen a cada lado

  const fontSizeTiers = [0.1, 0.085, 0.07, 0.056, 0.045].map((f) => width * f);

  for (const fontSize of fontSizeTiers) {
    const lines = wrapAtFontSize(words, fontSize, availableWidth);
    if (lines.length <= 3) {
      return { lines, fontSize };
    }
  }

  const fontSize = fontSizeTiers[fontSizeTiers.length - 1];
  return { lines: wrapAtFontSize(words, fontSize, availableWidth).slice(0, 3), fontSize };
}

async function buildTitleOverlaySvg(title: string, width: number, height: number) {
  const fontBuffer = await readFile(FONT_PATH);
  const fontBase64 = fontBuffer.toString("base64");

  const { lines, fontSize } = fitTitle(title, width);
  const lineHeight = fontSize * 1.25;
  const topMargin = height * 0.07;

  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="50%" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Cinzel';
        font-weight: 700;
        src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
      }
      .title {
        font-family: 'Cinzel', serif;
        font-weight: 700;
        font-size: ${fontSize}px;
        fill: ${GOLD};
        letter-spacing: ${fontSize * 0.03}px;
      }
    </style>
    <filter id="titleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${fontSize * 0.04}" stdDeviation="${fontSize * 0.08}" flood-color="#000000" flood-opacity="0.85" />
    </filter>
  </defs>
  <text class="title" text-anchor="middle" y="${topMargin + fontSize}" filter="url(#titleShadow)">
    ${tspans}
  </text>
</svg>`;

  return Buffer.from(svg);
}

/**
 * Compone la escena generada por la IA con el título de la canción (arriba)
 * y el logo de Seeker Gospel Music (esquina inferior derecha), superpuestos
 * de forma exacta y consistente — nunca generados por el modelo de imagen.
 */
export async function composeCoverImage(
  sceneBuffer: Buffer,
  title: string
): Promise<Buffer> {
  const scene = sharp(sceneBuffer);
  const metadata = await scene.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1536;

  const titleSvg = await buildTitleOverlaySvg(title, width, height);

  const logoTargetWidth = Math.round(width * 0.17);
  const logoMargin = Math.round(width * 0.04);
  const logoBuffer = await sharp(LOGO_PATH)
    .resize({ width: logoTargetWidth })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoBuffer).metadata();
  const logoHeight = logoMeta.height ?? logoTargetWidth;

  return sharp(sceneBuffer)
    .composite([
      { input: titleSvg, top: 0, left: 0 },
      {
        input: logoBuffer,
        top: height - logoHeight - logoMargin,
        left: width - logoTargetWidth - logoMargin,
      },
    ])
    .png()
    .toBuffer();
}
