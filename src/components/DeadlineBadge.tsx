import { Badge } from '@/components/Badge';
import { colors } from '@/constants/theme';
import { diasRestantes, urgencia, type Urgencia } from '@/lib/fechas';

const URGENCIA_COLOR: Record<Urgencia, string> = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  vencida: colors.textMuted,
};

// Urgencia: fondo del semántico al 15% y texto del semántico sólido.
export function DeadlineBadge({ fecha }: { fecha: string }) {
  const dias = diasRestantes(fecha);
  const color = URGENCIA_COLOR[urgencia(fecha)];
  const label =
    dias < 0 ? 'Cerrada' : dias === 0 ? 'Cierra hoy' : dias === 1 ? 'Cierra mañana' : `Cierra en ${dias} días`;
  // 26 en hex = ~15% de opacidad.
  return <Badge label={label} background={`${color}26`} color={color} />;
}
