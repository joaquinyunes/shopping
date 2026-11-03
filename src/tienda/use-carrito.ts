import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Producto } from '../tipos';
import { claveLinea } from '../lib/catalogo';
import { lineasDelCarrito, totalDelCarrito, type Carrito } from '../lib/pedido';

const CLAVE = 'casa-nido:carrito';

function leer(): Carrito {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {}; // sin storage o JSON roto: carrito vacío
  }
}

/** El carrito guarda cantidades por clave de línea: «id» o «id::variante». */
export function useCarrito(productos: Producto[]) {
  const [carrito, setCarrito] = useState<Carrito>(leer);

  useEffect(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(carrito)); } catch { /* sin storage: vive solo en esta visita */ }
  }, [carrito]);

  const cambiar = useCallback((clave: string, delta: number) => {
    setCarrito(c => {
      const n = (c[clave] ?? 0) + delta;
      const { [clave]: _quitado, ...resto } = c; // eslint-disable-line @typescript-eslint/no-unused-vars
      return n < 1 ? resto : { ...resto, [clave]: n };
    });
  }, []);

  const lineas = useMemo(() => lineasDelCarrito(carrito, productos), [carrito, productos]);
  return {
    carrito,
    lineas,
    cuenta: lineas.reduce((s, l) => s + l.cant, 0),
    total: totalDelCarrito(carrito, productos),
    agregar: (id: string, varianteId?: string) => cambiar(claveLinea(id, varianteId), 1),
    cambiar,
  };
}
