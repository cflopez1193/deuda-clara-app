import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import type { Debt } from '@/domain/types';

import { DebtClaraWidget } from './debt-clara-widget';
import { toWidgetData } from './data';

export async function refreshDebtWidget(debts: Debt[]): Promise<void> {
  if (Platform.OS !== 'android') return;

  const data = toWidgetData(debts);

  try {
    await requestWidgetUpdate({
      widgetName: 'DeudaClara',
      renderWidget: ({ height }) => {
        const maxDebts = height >= 245 ? 4 : height >= 185 ? 3 : 2;
        return {
          light: (
            <DebtClaraWidget data={data} theme="light" maxDebts={maxDebts} />
          ),
          dark: (
            <DebtClaraWidget data={data} theme="dark" maxDebts={maxDebts} />
          ),
        };
      },
    });
  } catch {
    // The widget is optional. A web build or an older APK may not expose
    // the native module, and that must never block the app.
  }
}
