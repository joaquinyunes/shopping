/** Build de demostración (`npm run build:demo`): otro sitio, con cartel y sin API ni base real. El entorno real nunca se usa para mostrar. */
export const esDemo = import.meta.env.MODE === 'demo';
