import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card, type IoniconName } from '@/components/ui/app-button';
import { StackScreen } from '@/components/ui/stack-screen';
import { radius, spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

const sections: {
  icon: IoniconName;
  title: string;
  paragraphs: string[];
}[] = [
  {
    icon: 'phone-portrait-outline',
    title: 'Tus datos financieros viven en tu teléfono',
    paragraphs: [
      'Tu perfil, movimientos, deudas y pagos se guardan en una base de datos local dentro de la app. Puedes consultarlos sin conexión una vez que hayas iniciado sesión.',
      'Para proteger el acceso usamos Supabase, un servicio de autenticación. Allí solo se guarda tu correo y la información técnica de la sesión; nunca tus deudas, movimientos ni ingresos.',
    ],
  },
  {
    icon: 'clipboard-outline',
    title: 'Qué información guardamos',
    paragraphs: [
      'En tu teléfono guardamos el nombre o apodo que eliges, tu ingreso mensual estimado, tus movimientos, tus deudas, pagos y las preferencias del plan. No solicitamos documentos, números de cuenta ni credenciales bancarias.',
      'En Supabase guardamos tu dirección de correo y los datos necesarios para enviarte el código de acceso y mantener tu sesión activa.',
    ],
  },
  {
    icon: 'download-outline',
    title: 'Respaldo y eliminación',
    paragraphs: [
      'Puedes exportar un respaldo JSON o un archivo CSV desde Ajustes. Esos archivos quedan bajo tu control cuando los compartes.',
      'También puedes borrar toda la información desde Ajustes. La eliminación es inmediata y definitiva en este dispositivo. Si no tienes un respaldo, no podremos recuperarla.',
      'Cerrar sesión no borra tus datos locales. Si otra cuenta inicia sesión en el mismo teléfono, los datos de la cuenta anterior se eliminan para evitar que se mezclen.',
    ],
  },
  {
    icon: 'lock-closed-outline',
    title: 'Seguridad',
    paragraphs: [
      'Recomendamos proteger tu teléfono con PIN, patrón o huella. La sesión se guarda en el almacenamiento local de la app y se renueva automáticamente cuando hay conexión.',
      'En una versión futura agregaremos bloqueo biométrico dentro de la app y cifrado de la base local.',
      'La app nunca te pedirá tu clave bancaria ni el número completo de una tarjeta.',
    ],
  },
  {
    icon: 'cloud-outline',
    title: 'Sincronización futura',
    paragraphs: [
      'Hoy solo tu correo de acceso viaja a la nube. Cuando habilitemos el espacio Hogar y la sincronización, te pediremos autorización antes de enviar datos financieros y aplicaremos controles de acceso por usuario.',
    ],
  },
  {
    icon: 'information-circle-outline',
    title: 'Tus derechos en Colombia',
    paragraphs: [
      'La Ley 1581 de 2012 y el Decreto 1377 de 2013 protegen tus datos personales. Tu correo se usa únicamente para autenticación y puedes solicitar su acceso, corrección o eliminación a través del canal de soporte de Deuda Clara.',
      'Los datos financieros permanecen en tu dispositivo y puedes eliminarlos en cualquier momento desde Ajustes.',
    ],
  },
  {
    icon: 'alert-circle-outline',
    title: 'Herramienta educativa',
    paragraphs: [
      'Deuda Clara ayuda a registrar, entender y planificar finanzas personales. Los cálculos son estimaciones y no constituyen asesoría financiera regulada, oferta de crédito ni garantía de resultados.',
      'Si tus ingresos no cubren tus obligaciones básicas, busca apoyo de entidades de orientación financiera gratuita o de profesionales certificados.',
    ],
  },
];

export default function PrivacyScreen() {
  const { colors } = useAppTheme();

  return (
    <StackScreen title="Privacidad y datos">
      <View style={[styles.banner, { backgroundColor: colors.primarySoft }]}>
        <View style={[styles.bannerIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.bannerText}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            Privacidad desde el primer día
          </Text>
          <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
            Tu cuenta protege el acceso. Tus datos financieros se quedan en tu teléfono.
          </Text>
        </View>
      </View>

      {sections.map((section) => (
        <Card key={section.title} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={section.icon} size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
          </View>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={[styles.paragraph, { color: colors.textSecondary }]}>
              {paragraph}
            </Text>
          ))}
        </Card>
      ))}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Última actualización: noviembre de 2026 · Versión local 1.0 con acceso por correo
        </Text>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: typography.tiny,
    lineHeight: 17,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.small,
    fontWeight: '800',
  },
  paragraph: {
    fontSize: typography.small,
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  footerText: {
    fontSize: typography.tiny,
    textAlign: 'center',
    lineHeight: 17,
  },
});
