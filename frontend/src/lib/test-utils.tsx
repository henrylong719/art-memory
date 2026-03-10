/* eslint-disable react-refresh/only-export-components */
import type { ReactElement, ReactNode } from 'react';
import type { RenderOptions } from '@testing-library/react-native';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { render, userEvent } from '@testing-library/react-native';
import '@shopify/flash-list/jestSetup';

function createAppWrapper() {
  return ({ children }: { children: ReactNode }) => (
    <BottomSheetModalProvider>
      <NavigationContainer>{children}</NavigationContainer>
    </BottomSheetModalProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const Wrapper = createAppWrapper(); // make sure we have a new wrapper for each render
  return render(ui, { wrapper: Wrapper, ...options });
}

// use this if you want to test user events
export function setup(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const Wrapper = createAppWrapper();
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export * from '@testing-library/react-native';
export { customRender as render };
