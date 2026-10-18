/** Paleta cerrada del hero (la misma del resto de la tienda). */
export const PALETA = {
  fondo: 0x1b1714,
  crema: 0xf7f1e8,
  papel: 0xfffaf3,
  terracota: 0xc4623f,
  terracotaOsc: 0xa44d2e,
  salvia: 0x7d9277,
  ambar: 0xf3c98b,
  tinta: 0x2b2420,
  madera: 0x7a4e32,
  maderaOsc: 0x3b2619,
  lino: 0xe6d8c0,
} as const;

export const hexCss = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
