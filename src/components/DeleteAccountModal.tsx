import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { ErrorBanner } from '@/components/ErrorBanner';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { cancelarRecordatorios } from '@/lib/recordatorios';
import { supabase } from '@/lib/supabase';

type DeleteAccountModalProps = {
  visible: boolean;
  onClose: () => void;
};

type IconName = ComponentProps<typeof Ionicons>['name'];

// Borrado de cuenta dentro de la app (política de Play Store: la cuenta y sus datos asociados
// se eliminan, no solo se desactivan). Explica qué se borra antes de confirmar.
export function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const insets = useSafeAreaInsets();
  const [entiendo, setEntiendo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cerrar = () => {
    if (deleting) return;
    setEntiendo(false);
    setError(null);
    onClose();
  };

  const eliminar = async () => {
    setError(null);
    setDeleting(true);
    // La RPC borra auth.users; profiles y guardadas caen en cascada en la BD.
    const { error: rpcError } = await supabase.rpc('delete_account');
    if (rpcError) {
      setDeleting(false);
      setError('No pudimos eliminar tu cuenta. Revisa tu conexión e inténtalo de nuevo');
      return;
    }
    await cancelarRecordatorios().catch(() => {});
    // Con la sesión cerrada el guard raíz manda a Landing y este modal se desmonta.
    await supabase.auth.signOut();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={cerrar} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="trash-outline" size={28} color={colors.secondary} />
              </View>
              <Text style={styles.title}>Eliminar tu cuenta</Text>
              <Text style={styles.lead}>Antes de continuar, esto es lo que pasa:</Text>
            </View>

            <Punto
              icon="person-remove-outline"
              title="Se borra todo lo tuyo"
              body="Tu cuenta de acceso (correo y contraseña o Google), tu perfil (apodo, rango de edad, nivel, avatar, color, intereses e institución) y tus favoritos."
            />
            <Punto
              icon="notifications-off-outline"
              title="Se cancelan tus recordatorios"
              body="Los avisos de fechas límite programados en este teléfono se eliminan."
            />
            <Punto
              icon="flash-outline"
              title="Es inmediato y permanente"
              body="No se puede deshacer ni recuperar. Tus datos pueden permanecer poco tiempo en copias de seguridad cifradas del proveedor, hasta que estas se renuevan automáticamente."
            />
            <Punto
              icon="globe-outline"
              title="Las convocatorias no cambian"
              body="Las becas y programas son información pública y siguen disponibles para los demás."
            />
            <Punto
              icon="refresh-outline"
              title="Puedes volver cuando quieras"
              body="Podrás crear una cuenta nueva con el mismo correo, pero empezará desde cero."
            />

            <View style={styles.confirm}>
              <Checkbox
                checked={entiendo}
                onToggle={() => setEntiendo((v) => !v)}
                accessibilityLabel="Entiendo que eliminar mi cuenta es permanente"
              >
                <Text style={styles.confirmText}>Entiendo que eliminar mi cuenta es permanente</Text>
              </Checkbox>
            </View>

            {error && <ErrorBanner message={error} />}

            <Button
              label="Eliminar mi cuenta"
              variant="secondary"
              disabled={!entiendo}
              loading={deleting}
              onPress={eliminar}
            />
            <Button label="Cancelar" variant="ghost" onPress={cerrar} disabled={deleting} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Punto({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <View style={styles.punto}>
      <Ionicons name={icon} size={22} color={colors.primaryText} style={styles.puntoIcon} />
      <View style={styles.puntoText}>
        <Text style={styles.puntoTitle}>{title}</Text>
        <Text style={styles.puntoBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(43,45,66,0.45)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  header: { alignItems: 'center', gap: spacing.sm },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.h1, color: colors.text },
  lead: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  punto: { flexDirection: 'row', gap: spacing.md },
  puntoIcon: { marginTop: 2 },
  puntoText: { flex: 1, gap: 2 },
  puntoTitle: { ...typography.bodyMedium, color: colors.text },
  puntoBody: { ...typography.body, color: colors.textMuted },
  confirm: { marginTop: spacing.sm },
  confirmText: { ...typography.body, color: colors.text, flex: 1 },
});
