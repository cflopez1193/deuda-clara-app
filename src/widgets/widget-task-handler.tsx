import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { DebtClaraWidget } from './debt-clara-widget';
import { emptyWidgetData, loadWidgetData } from './data';
import type { WidgetData } from './types';

const WIDGET_NAME = 'DeudaClara';

function maxDebtsForHeight(height: number): number {
  if (height >= 245) return 4;
  if (height >= 185) return 3;
  return 2;
}

async function readData(): Promise<WidgetData> {
  try {
    return await loadWidgetData();
  } catch {
    return emptyWidgetData;
  }
}

export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps
): Promise<void> {
  if (props.widgetInfo.widgetName !== WIDGET_NAME) return;

  if (
    props.widgetAction === 'WIDGET_ADDED' ||
    props.widgetAction === 'WIDGET_UPDATE' ||
    props.widgetAction === 'WIDGET_RESIZED'
  ) {
    const data = await readData();
    const maxDebts = maxDebtsForHeight(props.widgetInfo.height);

    props.renderWidget({
      light: (
        <DebtClaraWidget data={data} theme="light" maxDebts={maxDebts} />
      ),
      dark: <DebtClaraWidget data={data} theme="dark" maxDebts={maxDebts} />,
    });
    return;
  }

  if (props.widgetAction === 'WIDGET_CLICK') {
    // The quick actions use OPEN_URI, so Android opens the correct screen.
    // This branch keeps the widget refreshed for any custom click action
    // added in the future.
    const data = await readData();
    const maxDebts = maxDebtsForHeight(props.widgetInfo.height);

    props.renderWidget({
      light: (
        <DebtClaraWidget data={data} theme="light" maxDebts={maxDebts} />
      ),
      dark: <DebtClaraWidget data={data} theme="dark" maxDebts={maxDebts} />,
    });
  }
}
