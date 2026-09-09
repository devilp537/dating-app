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
  withTiming,
  FadeIn
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient } from '../api/client';
import { AntDesign, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const EMOJIS = ['👽', '👻', '🤖', '👾', '🤡', '🤠', '😎', '🤓', '🦊', '🐱'];

// تنظیم ابعاد دقیق متناسب با صفحه حتی در صفحه‌نمایش‌های کوچک (ارتفاع 520px)
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.75, 300);
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.52, 380);

const COLORS = {
  bg: '#000000',
  surface: '#111018',
  surfaceAlt: '#181622',
  border: 'rgba(167,139,250,0.18)',
  accent: '#8B5CF6',
  accentSoft: '#A78BFA',
  text: '#F5F3FF',
  textMuted: '#8B879A',
  pass: '#FB7185',
  like: '#22C55E',
};

type User = { id: string; name: string; bio: string; };

const ActionButton = ({ icon, color, onPress, isLarge = false }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const size = isLarge ? 64 : 54;

  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.92))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={onPress}
    >
      <Animated.View 
        style={[
          animatedStyle, 
          { 
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: COLORS.surface, 
            borderWidth: 1, 
            borderColor: COLORS.border,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: color, 
            shadowOpacity: 0.25, 
            shadowRadius: 14, 
            elevation: 8 
          }
        ]}
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
        <View 
          style={{ 
            width: CARD_WIDTH, 
            height: CARD_HEIGHT, 
            backgroundColor: COLORS.surface, 
            borderWidth: 1, 
            borderColor: COLORS.border,
            borderRadius: 36,
            shadowColor: COLORS.accentSoft,
            shadowOpacity: 0.2,
            shadowRadius: 24,
            elevation: 12,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16
          }}
        >
          <View 
            style={{ 
              width: 88, 
              height: 88, 
              borderRadius: 44, 
              backgroundColor: COLORS.surfaceAlt, 
              borderWidth: 1, 
              borderColor: COLORS.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}
          >
            <Text style={{ fontSize: 44 }}>{userEmoji}</Text>
          </View>
          <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 6, textAlign: 'center' }}>
            {user.name}
          </Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' }} numberOfLines={3}>
            {user.bio || 'بدون بیوگرافی'}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export default function HomeScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [externalDirection, setExternalDirection] = useState<'LIKE' | 'PASS' | null>(null);

  const fetchDiscoveryUsers = async () => {
    setLoading(true);
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

  useEffect(() => { fetchDiscoveryUsers(); }, []);

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

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, paddingTop: 36, paddingBottom: 24, justifyContent: 'space-between' }}>
        
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, height: 44 }}>
          <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: 2 }}>DISCOVER</Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <TouchableOpacity onPress={() => router.push('/matches')}>
              <Feather name="message-circle" size={24} color={COLORS.accentSoft} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => AsyncStorage.removeItem('userToken').then(() => router.replace('/'))}>
              <Feather name="log-out" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Card Viewport Area */}
        <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
             <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 36, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }}>
               <ActivityIndicator size="large" color={COLORS.accentSoft} />
             </View>
          ) : users.length > 0 ? (
            <SwipeableCard 
              key={users[0].id} 
              user={users[0]} 
              externalSwipeDirection={externalDirection}
              onSwipeOut={(type: 'LIKE' | 'PASS') => handleSwipeOut(users[0].id, type)} 
            />
          ) : (
            <Animated.View 
              entering={FadeIn.duration(400)}
              style={{ 
                width: CARD_WIDTH, 
                height: CARD_HEIGHT, 
                borderRadius: 36,
                backgroundColor: COLORS.surface, 
                borderWidth: 1, 
                borderColor: COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24
              }}
            >
              <Feather name="inbox" size={40} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
              <Text style={{ color: COLORS.textMuted, fontSize: 15, fontWeight: '500', marginBottom: 18 }}>کاربری یافت نشد</Text>
              
              <TouchableOpacity 
                onPress={fetchDiscoveryUsers}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 8, 
                  paddingHorizontal: 18, 
                  paddingVertical: 10, 
                  borderRadius: 14, 
                  backgroundColor: COLORS.surfaceAlt, 
                  borderWidth: 1, 
                  borderColor: COLORS.border 
                }}
              >
                <Feather name="refresh-cw" size={15} color={COLORS.accentSoft} />
                <Text style={{ color: COLORS.accentSoft, fontWeight: '700', fontSize: 13 }}>تلاش مجدد</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Actions Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28, height: 72 }}>
          {!loading && users.length > 0 && (
            <>
              <ActionButton 
                icon={<Feather name="x" size={26} color={COLORS.pass} />} 
                color={COLORS.pass}
                onPress={() => setExternalDirection('PASS')} 
              />
              <ActionButton 
                icon={<AntDesign name="heart" size={28} color={COLORS.accentSoft} />} 
                color={COLORS.accent}
                isLarge
                onPress={() => setExternalDirection('LIKE')} 
              />
            </>
          )}
        </View>

      </View>
    </GestureHandlerRootView>
  );
}