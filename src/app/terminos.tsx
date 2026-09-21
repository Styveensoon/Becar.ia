import { LegalScreen } from '@/components/LegalScreen';

// TODO: reemplazar con el texto legal definitivo.
const BODY =
  'Aquí irán los Términos y Condiciones de Becar.ia. Este texto es un marcador de posición ' +
  'mientras el equipo redacta la versión definitiva.';

export default function Terminos() {
  return <LegalScreen title="Términos y Condiciones" body={BODY} />;
}
