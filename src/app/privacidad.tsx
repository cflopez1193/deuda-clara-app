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
    title: 'Tus datos viven en tu teléfono',
    paragraphs: [
      'Esta versión de Deuda Clara funciona sin cuentas y sin conexión a internet. Tu perfil, movimientos y deudas se guardan en una base de datos local dentro de la app.',
      'No enviamos tu información a un servidor ni la compartimos con terceros.',
    ],
  },
  {
    icon: 'clipboard-outline',
    title: 'Qué información guardamos',
    paragraphs: [
      'Guardamos el nombre o apodo que eliges, tu ingreso mensual estimado, tus movimientos, tus deudas, pagos y las preferencias del plan. No solicitamos documentos, números de cuenta ni credenciales bancarias.',
    ],
  },
  {
    icon: 'download-outline',
    title: 'Respaldo y eliminación',
    paragraphs: [
      'Puedes exportar un respaldo JSON o un archivo CSV desde Ajustes. Esos archivos quedan bajo tu control cuando los compartes.',
      'También puedes borrar toda la información desde Ajustes. La eliminación es inmediata y definitiva en este dispositivo. Si no tienes un respaldo, no podremos recuperarla.',
    ],
  },
  {
    icon: 'lock-closed-outline',
    title: 'Seguridad',
    paragraphs: [
      'Recomendamos proteger tu teléfono con PIN, patrón o huella. En una versión futura agregaremos bloqueo biométrico dentro de la app y cifrado de la base local.',
      'La app nunca te pedirá tu clave bancaria ni el número completo de una tarjeta.',
    ],
  },
  {
    icon: 'cloud-outline',
    title: 'Sincronización futura',
    paragraphs: [
      'Cuando habilitemos espacios compartidos, te pediremos autorización antes de enviar datos a la nube. Esa versión tendrá política de privacidad, controles de acceso y opción de eliminar la cuenta.',
    ],
  },
  {
    icon: 'information-circle-outline',
    title: 'Tus derechos en Colombia',
    paragraphs: [
      'La Ley 1581 de 2012 y el Decreto 1377 de 2013 protegen tus datos personales. Como esta versión no transmite datos a un responsable remoto, el control principal está en tu dispositivo.',
      'Antes de publicar una versión con cuentas en la nube, Deuda Clara dispondrá de canales de atención y procedimientos para conocer, actualizar, rectificar y suprimir tus datos.',
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
            Sin cuentas, sin banco conectado y sin publicidad.
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
          Última actualización: noviembre de 2026 · Versión local 1.0
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
