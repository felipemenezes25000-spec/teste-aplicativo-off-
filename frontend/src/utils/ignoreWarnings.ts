import { LogBox } from 'react-native';

// Ignore specific warnings that are known issues
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  'Require cycle:',
  'Possible Unhandled Promise Rejection',
  'Setting a timer for a long period',
  'AsyncStorage has been extracted',
  'Animated: `useNativeDriver`',
  'componentWillReceiveProps',
  'componentWillMount',
]);

// In production, ignore all warnings
if (!__DEV__) {
  LogBox.ignoreAllLogs();
}