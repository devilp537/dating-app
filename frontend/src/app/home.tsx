import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
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
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type User = {
  id: string;
  name: string;
  bio: string;
};

// ------------------------------------------------------------------
// SwipeableCard Component
// ------------------------------------------------------------------
const SwipeableCard = ({ user, onSwipeOut }: { user: User, onSwipeOut: (type: 'LIKE' | 'PASS') => void }) => {
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
        const swipeType = isSwipedRight ? 'LIKE' : 'PASS';
        
        translateX.value = withSpring(Math.sign(event.translationX) * 500, { velocity: event.velocityX });
        translateY.value = withSpring(event.translationY, { velocity: event.velocityY });
        
        runOnJS(onSwipeOut)(swipeType);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10],
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


// ------------------------------------------------------------------
// HomeScreen Component
// ------------------------------------------------------------------
export default function HomeScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoveryUsers();
  }, []);

  const getValidToken = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token || token === 'null' || token === 'undefined') {
      return null;
    }
    return token;
  };

  const forceLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/');
  };

  const fetchDiscoveryUsers = async () => {
    try {
      const token = await getValidToken();
      
      if (!token) {
        console.log('Invalid Token Detected! Redirecting to login.');
        await forceLogout();
        return;
      }
      
      const response = await apiClient.get('/users/discovery', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error: any) {
      console.error('خطا در دریافت لیست کاربران:', error);
      if (error.response?.status === 401) {
        await forceLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await forceLogout();
  };

  const handleSwipeOut = async (targetId: string, type: 'LIKE' | 'PASS') => {
    setUsers((prevUsers) => prevUsers.slice(1));
    
    try {
      const token = await getValidToken();
      if (!token) {
        await forceLogout();
        return;
      }

      const response = await apiClient.post('/users/swipe', 
        { targetId, type }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.isMatch) {
        Alert.alert('تبریک! 🎉', 'شما با هم مچ شدید! حالا می‌توانید چت کنید.');
      }
    } catch (error: any) {
      console.error('خطا در ثبت تعامل:', error);
      if (error.response?.status === 401) {
         await forceLogout();
      } else {
         Alert.alert('خطای ارتباط', 'ارتباط با سرور برقرار نشد!');
      }
    }
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
        
        {/* هدر یکپارچه و اصلاح‌شده */}
        <View className="w-full flex-row justify-between items-center mb-8">
          <Text className="text-2xl font-bold text-teal-400">Discover</Text>
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity onPress={() => router.push('./matches')}>
              <Text className="text-teal-400 font-bold mr-4">مچ‌ها</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-zinc-500 font-bold">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View className="flex-1 relative w-full max-h-[550px]">
          {users.length > 0 ? (
            <SwipeableCard 
              key={users[0].id} 
              user={users[0]} 
              onSwipeOut={(type) => handleSwipeOut(users[0].id, type)} 
            />
          ) : (
            <View className="flex-1 items-center justify-center border border-zinc-800 border-dashed rounded-3xl">
              <Text className="text-gray-500 text-lg mb-4">کاربر دیگری یافت نشد!</Text>
              <TouchableOpacity onPress={fetchDiscoveryUsers} className="bg-teal-500 px-6 py-2 rounded-lg">
                <Text className="text-white font-bold">تلاش مجدد</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </View>
    </GestureHandlerRootView>
  );
}