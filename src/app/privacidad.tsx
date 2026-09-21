import { LegalScreen } from '@/components/LegalScreen';

// TODO: reemplazar con el Aviso de Privacidad definitivo.
const BODY =
  'Aquí irá el Aviso de Privacidad de Becar.ia. Este texto es un marcador de posición ' +
  'mientras el equipo redacta la versión definitiva.';

export default function Privacidad() {
  return <LegalScreen title="Aviso de Privacidad" body={BODY} />;
}
