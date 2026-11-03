const PASOS = [
  ['Elegí', 'Sumá al pedido lo que te guste. Si tiene opciones (talle, color), las elegís en su ficha.'],
  ['Mandanos el pedido', 'Con un toque se arma el mensaje con tu pedido y se abre WhatsApp.'],
  ['Coordinamos', 'Te confirmamos stock, envío y forma de pago por WhatsApp.'],
];

export function ComoPedir() {
  return (
    <section id="como-pedir" className="seccion como-pedir" aria-labelledby="titulo-como-pedir">
      <h2 id="titulo-como-pedir">Cómo pedir</h2>
      <ol className="pasos">
        {PASOS.map(([titulo, texto], i) => (
          <li key={titulo}>
            <span className="paso-num" aria-hidden="true">{i + 1}</span>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
