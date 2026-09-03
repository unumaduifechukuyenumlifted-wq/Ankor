/** Bottom navigation shell — screens 11, 12, 13, 20, 22. */
import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => <TabBar />}>
      <Tabs.Screen name="11-home" />
      <Tabs.Screen name="12-budget" />
      <Tabs.Screen name="13-goals" />
      <Tabs.Screen name="20-ai-chat" />
      <Tabs.Screen name="22-profile" />
    </Tabs>
  );
}
