import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import type { RootType } from '@/view/App';
import { container } from '@/di';
// crypto.getRandomValues polyfill for React Native for uuid package
import 'react-native-get-random-values';
import '@/promisePolyfill';

const Root = container.get<RootType>('Root');

registerRootComponent(Root);
