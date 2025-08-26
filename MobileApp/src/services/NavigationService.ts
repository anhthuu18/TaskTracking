import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';
import { RootStackParamList } from '../types/Navigation';

export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  navigationRef.current?.navigate(name as never, params as never);
}

export function goBack() {
  navigationRef.current?.goBack();
}

export function reset(routeName: keyof RootStackParamList) {
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: routeName as never }],
  });
}

export function getCurrentRoute() {
  return navigationRef.current?.getCurrentRoute();
}
