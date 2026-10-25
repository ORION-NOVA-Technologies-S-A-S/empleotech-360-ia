/**
 * Extrae el texto de una hoja de vida directamente en el navegador (no se sube a ningún servidor).
 * PDF con pdf.js y Word (.docx) con mammoth, cargados bajo demanda desde CDN.
 */
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs'
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'
const MAMMOTH = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js'
export const MAX_MB = 5

function cargarScript(src) {
  return new Promise((ok, mal) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok()
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar el lector de Word.'))
    document.head.appendChild(s)
  })
}

async function textoPdf(archivo) {
  const url = PDFJS
  const pdfjs = await import(/* @vite-ignore */ url)
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await archivo.arrayBuffer()) }).promise
  let texto = ''
  for (let i = 1; i <= Math.min(doc.numPages, 6); i++) {
    const pag = await doc.getPage(i)
    texto += (await pag.getTextContent()).items.map((x) => x.str).join(' ') + '\n'
  }
  return texto
}

async function textoDocx(archivo) {
  await cargarScript(MAMMOTH)
  const r = await window.mammoth.extractRawText({ arrayBuffer: await archivo.arrayBuffer() })
  return r.value
}

export async function leerHojaVida(archivo) {
  if (archivo.size > MAX_MB * 1024 * 1024) throw new Error(`El archivo pesa más de ${MAX_MB} MB.`)
  const nombre = archivo.name.toLowerCase()
  let texto
  if (nombre.endsWith('.pdf')) texto = await textoPdf(archivo)
  else if (nombre.endsWith('.docx')) texto = await textoDocx(archivo)
  else if (nombre.endsWith('.txt')) texto = await archivo.text()
  else throw new Error('Sube tu hoja de vida en PDF, Word (.docx) o texto (.txt).')
  texto = texto.replace(/\s+/g, ' ').trim()
  if (texto.length < 80) throw new Error('No pude leer texto en el archivo. Si es un PDF escaneado (imagen), súbelo en Word o copia y pega el texto en el chat.')
  return texto.slice(0, 20000)
}
