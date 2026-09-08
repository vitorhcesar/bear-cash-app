import { Redirect } from 'expo-router';

/** Compat: /home → tab Home */
export default function HomeRedirect() {
  return <Redirect href="/(tabs)" />;
}
