//home.tsx
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Alert, Pressable } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS, 
  interpolate, 
  Extrapolation,
  withTiming
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient } from '../api/client';
import { AntDesign, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const EMOJIS = ['👽', '👻', '🤖', '👾', '🤡', '🤠', '😎', '🤓', '🦊', '🐱'];

type User = { id: string; name: string; bio: string; };

const MinimalButton = ({ icon, color, onPress, isLarge = false }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.9))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={onPress}
    >
      <Animated.View 
        className={`${isLarge ? 'w-20 h-20' : 'w-16 h-16'} bg-[#18181B] border border-white/5 rounded-full items-center justify-center`}
        style={[animatedStyle, { shadowColor: color, shadowOpacity: 0.15, shadowRadius: 25, elevation: 15 }]}
      >
        {icon}
      </Animated.View>
    </Pressable>
  );
};

const SwipeableCard = ({ user, onSwipeOut, externalSwipeDirection }: any) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const userEmoji = EMOJIS[user.id.charCodeAt(0) % EMOJIS.length];

  useEffect(() => {
    if (externalSwipeDirection === 'LIKE') {
      translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => runOnJS(onSwipeOut)('LIKE'));
    } else if (externalSwipeDirection === 'PASS') {
      translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => runOnJS(onSwipeOut)('PASS'));
    }
  }, [externalSwipeDirection]);

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
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2], [-8, 0, 8], Extrapolation.CLAMP);
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, { position: 'absolute', zIndex: 1 }]} className="w-full items-center">
        {/* ابعاد کارت در اینجا به صورت دقیق (عرض 320، ارتفاع 480) تنظیم شده تا زیادی بزرگ نباشد */}
        <View className="w-[320px] h-[480px] bg-[#18181B] rounded-[48px] border border-white/5 p-8 items-center justify-center shadow-2xl">
          <View className="w-32 h-32 bg-[#27272A] rounded-full items-center justify-center mb-8 border border-white/5">
            <Text className="text-6xl">{userEmoji}</Text>
          </View>
          <Text className="text-3xl font-extrabold text-white mb-3 tracking-wide">{user.name}</Text>
          <Text className="text-[#A1A1AA] text-center text-base leading-7 px-2">{user.bio || 'بدون بیوگرافی'}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default function HomeScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [externalDirection, setExternalDirection] = useState<'LIKE' | 'PASS' | null>(null);

  useEffect(() => { fetchDiscoveryUsers(); }, []);

  const fetchDiscoveryUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return router.replace('/');
      const response = await apiClient.get('/users/discovery', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeOut = async (targetId: string, type: 'LIKE' | 'PASS') => {
    setUsers((prev) => prev.slice(1));
    setExternalDirection(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await apiClient.post('/users/swipe', { targetId, type }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.isMatch) Alert.alert('تبریک! 🎉', 'شما با هم مچ شدید!');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#09090B]">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1 bg-[#09090B]">
      <View className="flex-1 pt-16 pb-12">
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-8 mb-4">
          <Text className="text-2xl font-extrabold text-white tracking-widest uppercase">Discover</Text>
          <View className="flex-row space-x-6">
            <TouchableOpacity onPress={() => router.push('/matches')}>
              <Feather name="message-circle" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => AsyncStorage.removeItem('userToken').then(() => router.replace('/'))}>
              <Feather name="log-out" size={26} color="#52525B" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Cards Container - اضافه کردن Flex-1 برای وسط‌چین کردن عمودی */}
        <View className="flex-1 w-full items-center justify-center mt-4">
          {users.length > 0 ? (
            <SwipeableCard 
              key={users[0].id} 
              user={users[0]} 
              externalSwipeDirection={externalDirection}
              onSwipeOut={(type: 'LIKE' | 'PASS') => handleSwipeOut(users[0].id, type)} 
            />
          ) : (
            <View className="w-[320px] h-[480px] items-center justify-center bg-[#18181B] rounded-[48px] border border-white/5">
              <Feather name="inbox" size={48} color="#3F3F46" className="mb-4" />
              <Text className="text-[#A1A1AA] text-lg font-medium">کاربری یافت نشد</Text>
            </View>
          )}
        </View>

        {/* Action Buttons - ایجاد فاصله مناسب با مارجین بالا */}
        {users.length > 0 && (
          <View className="flex-row justify-center items-center space-x-8 mt-10">
            <MinimalButton 
              icon={<Feather name="x" size={28} color="#EF4444" />} 
              color="#EF4444"
              onPress={() => setExternalDirection('PASS')} 
            />
            <MinimalButton 
              icon={<AntDesign name="heart" size={32} color="#06B6D4" />} 
              color="#06B6D4"
              isLarge
              onPress={() => setExternalDirection('LIKE')} 
            />
          </View>
        )}

      </View>
    </GestureHandlerRootView>
  );
}