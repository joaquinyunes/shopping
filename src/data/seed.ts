import type { Datos } from '../tipos';

export const CATEGORIAS = ['Cocina', 'Deco', 'Textiles', 'Baño', 'Organización', 'Herrajes'];

const foto = (id: string) => `/img/productos/${id}.webp`;

// Fotos ilustrativas generadas con IA (Gemini). La dueña las reemplaza por fotos reales desde el admin.
export const DATOS_INICIALES: Datos = {
  tienda: {
    nombre: 'Casa Nido',
    lema: 'Productos para el hogar',
    whatsapp: '5491100000000',
    hero3d: true,
    camara: true,
  },
  productos: [
    { id: 'taza', nombre: 'Taza de cerámica', categoria: 'Cocina', precio: 8500, foto: foto('taza'), descripcion: 'Taza artesanal, esmalte mate y asa ancha' },
    { id: 'platos', nombre: 'Set de platos de cerámica', categoria: 'Cocina', precio: 24500, foto: foto('platos'), descripcion: '3 platos, color crema con borde terracota' },
    { id: 'tabla', nombre: 'Tabla de madera de olivo', categoria: 'Cocina', precio: 11200, foto: foto('tabla'), descripcion: 'Tabla con mango y agujero para colgar' },
    { id: 'frasco', nombre: 'Frasco de vidrio hermético', categoria: 'Cocina', precio: 5400, foto: foto('frasco'), descripcion: 'Frasco de vidrio, tapa de bambú y cierre de goma' },
    { id: 'cafetera', nombre: 'Cafetera de émbolo', categoria: 'Cocina', precio: 21000, foto: foto('cafetera'), descripcion: 'Cafetera de vidrio y acero color cobre' },
    { id: 'florero', nombre: 'Florero acanalado', categoria: 'Deco', precio: 14900, foto: foto('florero'), descripcion: 'Florero de cerámica verde salvia y ramas de eucalipto' },
    { id: 'vela', nombre: 'Vela aromática de soja', categoria: 'Deco', precio: 7200, foto: foto('vela'), descripcion: 'Vela en vaso de vidrio ámbar y tapa de madera' },
    { id: 'maceta', nombre: 'Maceta de terracota', categoria: 'Deco', precio: 9800, foto: foto('maceta'), descripcion: 'Maceta de terracota y una planta chica' },
    { id: 'canasto', nombre: 'Canasto de mimbre', categoria: 'Deco', precio: 13600, foto: foto('canasto'), descripcion: 'Canasto trenzado con dos asas' },
    { id: 'lampara', nombre: 'Lámpara de mesa', categoria: 'Deco', precio: 32000, foto: foto('lampara'), descripcion: 'Pie de madera clara, pantalla de lino y cable textil' },
    { id: 'cortinas', nombre: 'Cortinas de lino con alzapaños', categoria: 'Textiles', precio: 38000, foto: foto('cortinas'), descripcion: 'Par de cortinas de lino crema con alzapaños terracota' },
    { id: 'almohadon', nombre: 'Almohadón de lino', categoria: 'Textiles', precio: 12500, foto: foto('almohadon'), descripcion: 'Funda de lino terracota y relleno' },
    { id: 'manta', nombre: 'Manta tejida', categoria: 'Textiles', precio: 27800, foto: foto('manta'), descripcion: 'Manta de lana con punto trenzado' },
    { id: 'toallas', nombre: 'Juego de toallas', categoria: 'Baño', precio: 18900, foto: foto('toallas'), descripcion: '3 toallas esponjosas de algodón en crema, salvia y terracota' },
    // Rubros nuevos: fotos ilustrativas (IA) y PRECIOS PROVISORIOS; la dueña los corrige desde el admin.
    { id: 'cubiertos', nombre: 'Set de cubiertos con mango de madera', categoria: 'Cocina', precio: 16500, foto: foto('cubiertos'), descripcion: 'Tenedor, cuchillo, cuchara y cucharita de acero con mango de madera clara' },
    { id: 'copas', nombre: 'Copas de vino de vidrio', categoria: 'Cocina', precio: 9800, foto: foto('copas'), descripcion: 'Par de copas de vidrio transparente con pie fino' },
    { id: 'bandeja', nombre: 'Bandeja de madera con asas', categoria: 'Cocina', precio: 15800, foto: foto('bandeja'), descripcion: 'Bandeja rectangular de madera clara con dos asas laterales' },
    { id: 'organizador', nombre: 'Organizador de cajón de bambú', categoria: 'Organización', precio: 13200, foto: foto('organizador'), descripcion: 'Organizador con divisiones para cubiertos y utensilios' },
    { id: 'manijas', nombre: 'Set de 4 tiradores de cerámica', categoria: 'Herrajes', precio: 11500, foto: foto('manijas'), descripcion: 'Tiradores terracota con base dorada mate para muebles' },
    { id: 'espejo', nombre: 'Espejo redondo con marco de madera', categoria: 'Deco', precio: 29500, foto: foto('espejo'), descripcion: 'Espejo decorativo redondo con marco fino de madera clara' },
  ],
};
