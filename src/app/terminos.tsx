import { LegalScreen } from '@/components/LegalScreen';
import { LEGAL_FECHA, TERMINOS } from '@/constants/legal';

export default function Terminos() {
  return (
    <LegalScreen
      title="Términos y Condiciones"
      updated={LEGAL_FECHA}
      intro="Léelos con calma: explican qué es Becar.ia, qué puedes esperar de la App y qué te pedimos a cambio. Es corto y sin letras chiquitas."
      sections={TERMINOS}
    />
  );
}
