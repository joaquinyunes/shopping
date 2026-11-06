// Activa las fuentes de Google sin bloquear el primer dibujo (la CSP no permite onload en línea, por eso es un archivo aparte).
document.querySelectorAll('link[data-fuente]').forEach(l => { l.media = 'all'; });
