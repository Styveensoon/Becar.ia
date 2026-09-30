import { Badge } from '@/components/Badge';
import { colors } from '@/constants/theme';
import { CATEGORIA_LABEL, type Categoria } from '@/lib/oportunidades';

export function CategoryBadge({ categoria }: { categoria: Categoria }) {
  return <Badge label={CATEGORIA_LABEL[categoria]} background={colors.primaryTint} color={colors.primaryText} />;
}
