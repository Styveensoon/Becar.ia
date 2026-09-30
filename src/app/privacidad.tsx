import { LegalScreen } from '@/components/LegalScreen';
import { LEGAL_FECHA, PRIVACIDAD } from '@/constants/legal';

export default function Privacidad() {
  return (
    <LegalScreen
      title="Aviso de Privacidad"
      updated={LEGAL_FECHA}
      intro="En resumen: pedimos lo mínimo, no usamos tu nombre real, no vendemos ni compartimos tus datos para publicidad, y puedes borrar todo cuando quieras."
      sections={PRIVACIDAD}
    />
  );
}
