import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient } from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // اگر ۲۵ درصد عرض صفحه کشیده شود، تایید می‌شود

type User = {
  id: string;
  name: string;
  bio: string;
};

// کامپوننت مجزا برای هر کارت تعاملی
const SwipeableCard = ({ user, onSwipeOut }: { user: User, onSwipeOut: () => void }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const isSwipedRight = event.translationX > SWIPE_THRESHOLD;
      const isSwipedLeft = event.translationX < -SWIPE_THRESHOLD;

      if (isSwipedRight || isSwipedLeft) {
        // پرتاب شدن کارت به بیرون از صفحه
        translateX.value = withSpring(Math.sign(event.translationX) * 500, { velocity: event.velocityX });
        translateY.value = withSpring(event.translationY, { velocity: event.velocityY });
        
        // اجرای تابع حذف کارت از لیست پس از اتمام انیمیشن
        runOnJS(onSwipeOut)();
      } else {
        // بازگشت فنری به مرکز در صورتی که کارت به اندازه کافی کشیده نشده باشد
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    // ایجاد چرخش ملایم بر اساس میزان جابجایی در محور X
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10], // حداکثر ۱۰ درجه چرخش
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, { position: 'absolute', width: '100%', height: '100%', zIndex: 1 }]}>
        <View className="w-full h-full bg-zinc-800 rounded-3xl border border-zinc-700 p-6 items-center justify-center shadow-lg">
          <Text className="text-3xl font-bold text-white mb-2">{user.name}</Text>
          <Text className="text-gray-400 text-center text-lg">{user.bio || 'بدون بیوگرافی'}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default function HomeScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoveryUsers();
  }, []);

  const fetchDiscoveryUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await apiClient.get('/users/discovery', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('خطا در دریافت لیست کاربران:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/');
  };

  const handleSwipeOut = () => {
    // کاربر فعلی را از آرایه حذف کن تا کارت بعدی رندر شود
    setUsers((prevUsers) => prevUsers.slice(1));
    // در مراحل بعدی می‌توانیم در اینجا درخواست Like یا Pass را به بک‌اند بفرستیم
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900">
        <ActivityIndicator size="large" color="#2dd4bf" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1 bg-zinc-900">
      <View className="flex-1 px-6 pt-16 pb-8">
        
        {/* هدر */}
        <View className="w-full flex-row justify-between items-center mb-8">
          <Text className="text-2xl font-bold text-teal-400">Discover</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-zinc-500 font-bold">Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* کانتینر کارت‌ها */}
        <View className="flex-1 relative w-full max-h-[550px]">
          {users.length > 0 ? (
            // فقط اولین کاربر در آرایه را به عنوان کارت بالایی و تعاملی رندر می‌کنیم
            <SwipeableCard 
              key={users[0].id} 
              user={users[0]} 
              onSwipeOut={handleSwipeOut} 
            />
          ) : (
            <View className="flex-1 items-center justify-center border border-zinc-800 border-dashed rounded-3xl">
              <Text className="text-gray-500 text-lg">کاربر دیگری در اطراف شما یافت نشد!</Text>
            </View>
          )}
        </View>

      </View>
    </GestureHandlerRootView>
  );
}