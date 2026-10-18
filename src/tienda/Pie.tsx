import { linkWhatsApp } from '../lib/pedido';
import type { Tienda } from '../tipos';

export function Pie({ tienda }: { tienda: Tienda }) {
  return (
    <footer className="pie">
      <p><strong>{tienda.nombre}</strong> · {tienda.lema} · tienda online</p>
      <p><a href={linkWhatsApp(tienda.whatsapp, `¡Hola ${tienda.nombre}! Quería hacer una consulta.`)} target="_blank" rel="noopener noreferrer">Escribinos por WhatsApp</a></p>
      <p className="pie-chico"><a href="#/admin">Admin</a></p>
    </footer>
  );
}
