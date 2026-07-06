import "server-only";
import path from "path";
import sharp from "sharp";
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";

const LOGO_PATH = path.join(process.cwd(), "assets", "logo-sgm.png");
const FONT_PATH = path.join(process.cwd(), "assets", "fonts", "Cinzel-Bold.ttf");
const FONT_FAMILY = "SGM Cover Title";

const GOLD = "#e6c675";
const LETTER_SPACING_EM = 0.03;

let fontRegistered = false;
function ensureFontRegistered() {
  if (!fontRegistered) {
    GlobalFonts.registerFromPath(FONT_PATH, FONT_FAMILY);
    fontRegistered = true;
  }
}

function measureLine(ctx: SKRSContext2D, line: string, letterSpacing: number) {
  const chars = [...line];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  return widths.reduce((sum, w) => sum + w, 0) + letterSpacing * Math.max(0, chars.length - 1);
}

/** Envuelve el título en líneas que quepan en availableWidth, midiendo glyphs reales. */
function wrapAtFontSize(
  ctx: SKRSContext2D,
  words: string[],
  fontSize: number,
  letterSpacing: number,
  availableWidth: number
): string[] {
  ctx.font = `700 ${fontSize}px "${FONT_FAMILY}"`;

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureLine(ctx, candidate, letterSpacing) > availableWidth && current) {
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
 * líneas o menos dentro del ancho disponible, midiendo con el canvas real.
 */
function fitTitle(ctx: SKRSContext2D, title: string, width: number) {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  const availableWidth = width * 0.84; // 8% de margen a cada lado

  const fontSizeTiers = [0.1, 0.085, 0.07, 0.056, 0.045].map((f) => width * f);

  for (const fontSize of fontSizeTiers) {
    const letterSpacing = fontSize * LETTER_SPACING_EM;
    const lines = wrapAtFontSize(ctx, words, fontSize, letterSpacing, availableWidth);
    if (lines.length <= 3) {
      return { lines, fontSize, letterSpacing };
    }
  }

  const fontSize = fontSizeTiers[fontSizeTiers.length - 1];
  const letterSpacing = fontSize * LETTER_SPACING_EM;
  return {
    lines: wrapAtFontSize(ctx, words, fontSize, letterSpacing, availableWidth).slice(0, 3),
    fontSize,
    letterSpacing,
  };
}

/** ctx.fillText no soporta letter-spacing directamente: se dibuja glyph a glyph. */
function drawLetterSpacedCentered(
  ctx: SKRSContext2D,
  text: string,
  centerX: number,
  y: number,
  letterSpacing: number
) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth = widths.reduce((sum, w) => sum + w, 0) + letterSpacing * (chars.length - 1);

  let x = centerX - totalWidth / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + letterSpacing;
  });
  ctx.textAlign = prevAlign;
}

/**
 * Dibuja el título en un canvas transparente con @napi-rs/canvas, que
 * registra la fuente directamente desde el archivo sin depender de
 * fontconfig/fuentes del sistema — a diferencia de renderizar SVG con
 * sharp (resvg), esto sí funciona en el contenedor serverless de Vercel,
 * que no trae fuentes instaladas.
 */
function renderTitleLayer(title: string, width: number, height: number): Buffer {
  ensureFontRegistered();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const { lines, fontSize, letterSpacing } = fitTitle(ctx, title, width);
  const lineHeight = fontSize * 1.25;
  const topMargin = height * 0.07;

  ctx.font = `700 ${fontSize}px "${FONT_FAMILY}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = GOLD;
  ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
  ctx.shadowBlur = fontSize * 0.16;
  ctx.shadowOffsetY = fontSize * 0.04;

  lines.forEach((line, i) => {
    const y = topMargin + fontSize + i * lineHeight;
    drawLetterSpacedCentered(ctx, line, width / 2, y, letterSpacing);
  });

  return canvas.toBuffer("image/png");
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

  const titleLayer = renderTitleLayer(title, width, height);

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
      { input: titleLayer, top: 0, left: 0 },
      {
        input: logoBuffer,
        top: height - logoHeight - logoMargin,
        left: width - logoTargetWidth - logoMargin,
      },
    ])
    .png()
    .toBuffer();
}
