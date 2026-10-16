import type { AnnotationFile, DocMeta } from "@/lib/types";
import { sanitizeHtml, splitHtmlToPages } from "@/lib/text-format";

export const SAMPLE_ESSAY_ID = "sample-cuaderno";
export const SAMPLE_PDF_ID = "sample-informe";

const QUOTE = "el río se movió ocho metros en una década";

export function essayHtml(): string {
  return `
<h1>Cuaderno del río falso</h1>
<blockquote>Informe para revisión. No es un mapa: es la discusión de un mapa. Cada afirmación pide marca, clave y nota.</blockquote>
<p>En el verano de 1926 la comisión de límites caminó la ribera norte con un teodolito prestado y un cuaderno que se mojó dos veces. El plano que todavía cita el archivo municipal dibuja un meandro donde los vecinos recuerdan una playa recta. La discrepancia no es un adorno: decide de quién es el álamo, y con el álamo el derecho de paso.</p>
<p>Quien revise este texto debería marcar, no asentir. La frase más frágil es esta: ${QUOTE}. No hay hito, no hay año de la medición anterior, no hay nombre de quien sostuvo la mira. Si la cifra se queda, tiene que ganar una fuente o salir del párrafo.</p>
<h2>La orilla que no coincide</h2>
<p>El plano 14-B es una heliográfica sin escala legible en el margen inferior. Aun así el texto lo trata como si fuera una medición. Hay una diferencia entre recordar una playa y demostrar que el meandro no existía. La primera cabe en una nota. La segunda exige la foja.</p>
<p>Elena Varela escribe en septiembre de 1927 sobre el álamo y el camino de las vacas. No menciona metros ni meandro. Fundir su carta con el parte del barquero produce un testimonio único que en realidad son dos. O se separan, o se declara por qué se funden.</p>
<h2>Tres correcciones</h2>
<p>Primera. El cierre dice que el plano municipal queda corregido. No queda. Queda cuestionado. Corregir es otro documento, con firma y con fecha.</p>
<p>Segunda. «Comisión» no es un autor. Hace falta el nombre de quien firmó el acta del 12 de agosto, foja 4, donde consta la lluvia y no consta ninguna cifra.</p>
<p>Tercera. El derecho de paso no se deduce del álamo. Se deduce de quién lo plantó, o de una servidumbre escrita. Hoy el párrafo salta de un árbol a un derecho. El salto debe verse.</p>
<h2>Cómo quiero las marcas</h2>
<p>Cada objeción lleva una clave. No un garabato huérfano: una clave que se pueda citar en la carta al archivo. P para la pluma, S para el subrayado, N para la nota al margen, C cuando la cita queda iluminada en el propio texto.</p>
<p>Si la clave automática no sirve, se cambia. REV-12 dice más que un número cuando la nota va a salir del cuaderno. La pluma es para pensar encima del papel. El marcador es para lo que no puede quedarse como está. La nota al margen es la frase que el texto todavía no se atreve a decir.</p>
<h2>Lo que sí está en el archivo</h2>
<ul>
<li>Acta de la comisión, 12 de agosto de 1926, foja 4. Menciona lluvia, no metros.</li>
<li>Carta de Elena Varela, septiembre de 1927. Habla del álamo, no del meandro.</li>
<li>Plano 14-B, copia heliográfica, sin escala legible.</li>
</ul>
<p>Hasta que esas tres piezas se citen con foja, los ocho metros son una hipótesis, no un hallazgo. Anótalo así.</p>
`.trim();
}

function encode(text: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(text);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function buildEssayRecord(): { meta: DocMeta; bytes: ArrayBuffer; anno: AnnotationFile } {
  const html = essayHtml();
  const pages = splitHtmlToPages(sanitizeHtml(html));
  let page = 0;
  pages.forEach((item, index) => {
    if (item.html.includes("ocho metros")) page = index;
  });
  const now = Date.now();
  const anno: AnnotationFile = {
    version: 1,
    strokes: [],
    notes: [
      {
        id: "seed-note-1",
        kind: "note",
        page,
        y: 0.72,
        color: "#8f2d2d",
        clave: "N-001",
        comment: "Pedir la foja 4 antes de aceptar el meandro. La lluvia consta; los metros, no.",
        createdAt: now,
      },
    ],
    quotes: [
      {
        id: "seed-quote-1",
        kind: "quote",
        page,
        y: 0.62,
        color: "#e6b325",
        clave: "C-001",
        comment: "Ocho metros: bajar a hipótesis o citar la medición. Hoy no hay hito.",
        quote: QUOTE,
        createdAt: now,
      },
    ],
  };
  return {
    meta: {
      id: SAMPLE_ESSAY_ID,
      name: "Cuaderno del río falso.html",
      kind: "html",
      pageCount: Math.max(1, pages.length),
      addedAt: now - 2000,
    },
    bytes: encode(html),
    anno,
  };
}

export async function buildSamplePdf(): Promise<{ meta: DocMeta; bytes: ArrayBuffer }> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  doc.setTitle("Informe de campo");
  doc.setAuthor("Atril");
  const ink = rgb(0.11, 0.1, 0.08);
  const wax = rgb(0.56, 0.18, 0.18);

  const drawPage = (title: string, paragraphs: string[]) => {
    const page = doc.addPage([595.28, 841.89]);
    let y = 780;
    page.drawText(title, { x: 64, y, size: 20, font: bold, color: ink });
    y -= 18;
    page.drawText("Cuaderno 4  ·  ribera norte", { x: 64, y, size: 11, font, color: wax });
    y -= 36;
    for (const paragraph of paragraphs) {
      const lines = wrapText(paragraph, font, 12, 460);
      for (const line of lines) {
        if (y < 72) return;
        page.drawText(line, { x: 64, y, size: 12, font, color: ink });
        y -= 18;
      }
      y -= 10;
    }
  };

  drawPage("Informe de campo", [
    "Se revisa el plano 14-B junto con el acta del 12 de agosto de 1926. El plano dibuja un meandro. Los vecinos describen una playa recta. El cuaderno de la comisión se mojó y varias cifras quedaron ilegibles.",
    "No anotar todavía una distancia. La única medida que circula, ocho metros, no tiene hito ni nombre de quien midió. Hasta entonces el meandro es una hipótesis.",
    "Este PDF es una hoja de trabajo: la pluma, el marcador y la goma caen encima de la página. Cada trazo recibe una clave para citarlo después.",
  ]);
  drawPage("Pendientes", [
    "1. Pedir al archivo la foja 4 del acta. Confirmar que habla de lluvia y no de metros.",
    "2. Separar la carta de Elena Varela del parte del barquero. Son dos voces.",
    "3. No afirmar que el plano queda corregido. Queda cuestionado.",
    "4. Si una marca importa para la carta, cambiar su clave automática por algo citable, por ejemplo REV-12.",
  ]);

  const saved = await doc.save();
  const bytes = saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength) as ArrayBuffer;
  return {
    meta: {
      id: SAMPLE_PDF_ID,
      name: "Informe de campo.pdf",
      kind: "pdf",
      pageCount: 2,
      addedAt: Date.now(),
    },
    bytes,
  };
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}
