import { linkWhatsApp } from '../lib/pedido';
import type { Tienda } from '../tipos';

export function Pie({ tienda }: { tienda: Tienda }) {
  return (
    <footer className="pie">
      <div className="pie-grilla">
        <div>
          <p className="pie-marca">{tienda.nombre}</p>
          <p>{tienda.lema}. Tienda online.</p>
        </div>
        <div>
          <h2>Envíos</h2>
          <p>A todo el país. Calculás el costo con tu código postal al armar el pedido.</p>
        </div>
        <div>
          <h2>Medios de pago</h2>
          <p>Los coordinamos por WhatsApp cuando confirmamos tu pedido.</p>
        </div>
        <div>
          <h2>Contacto</h2>
          <p><a href={linkWhatsApp(tienda.whatsapp, `¡Hola ${tienda.nombre}! Quería hacer una consulta.`)} target="_blank" rel="noopener noreferrer">Escribinos por WhatsApp</a></p>
        </div>
      </div>
      <p className="pie-chico"><a href="#/admin">Admin</a></p>
    </footer>
  );
}
