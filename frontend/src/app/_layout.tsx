import { Stack } from 'expo-router';
import '../../global.css';
// وارد کردن استایل‌های گلوبال تیل‌ویند (اگر فایلی به نام global.css ساخته‌اید، آن را اینجا ایمپورت کنید)

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}