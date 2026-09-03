import { Redirect } from 'expo-router';

/** Entry — screen 01 (splash) handles routing. */
export default function Index() {
  return <Redirect href="/01-splash" />;
}
