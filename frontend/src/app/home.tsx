import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Pressable, Platform, Modal, Clipboard } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS, 
  interpolate, 
  Extrapolation,
  withTiming,
  FadeIn,
  ZoomIn,
  type SharedValue
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient } from '../api/client';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const EMOJIS = ['👽', '👻', '🤖', '👾', '🤡', '🤠', '😎', '🤓', '🦊', '🐱'];

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
  rewind: '#FBBF24',
};

type User = { id: string; name: string; bio: string; contactId?: string };

const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
  if (Platform.OS === 'web') return;
  if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  else if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

// کامپوننت پاپ‌آپ تمام‌صفحه Match Modal
const MatchModal = ({ 
  visible, 
  matchedUser, 
  onClose, 
  onGoToChat 
}: { 
  visible: boolean; 
  matchedUser: User | null; 
  onClose: () => void; 
  onGoToChat: () => void; 
}) => {
  const [copied, setCopied] = useState(false);

  if (!visible || !matchedUser) return null;

  const targetEmoji = EMOJIS[matchedUser.id.charCodeAt(0) % EMOJIS.length];

  const handleCopy = () => {
    if (matchedUser.contactId) {
      Clipboard.setString(matchedUser.contactId);
      triggerHaptic('success');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/90 items-center justify-center px-6">
        <Animated.View 
          entering={ZoomIn.duration(350)}
          className="w-full max-w-[340px] items-center rounded-[36px] p-8 border"
          style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
        >
          {/* بج عنوان */}
          <View className="px-4 py-1.5 rounded-full mb-6 border" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: COLORS.accentSoft }}>
            <Text className="text-xs font-bold tracking-widest uppercase" style={{ color: COLORS.accentSoft }}>
              IT'S A MATCH!
            </Text>
          </View>

          {/* آواتارهای متقاطع */}
          <View className="flex-row items-center justify-center mb-6">
            <View className="w-20 h-20 rounded-full items-center justify-center border-2 z-10 -mr-3" style={{ backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.accentSoft }}>
              <Text className="text-3xl">✨</Text>
            </View>
            <View className="w-20 h-20 rounded-full items-center justify-center border-2 z-0" style={{ backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.accent }}>
              <Text className="text-3xl">{targetEmoji}</Text>
            </View>
          </View>

          <Text className="text-2xl font-extrabold text-center mb-2" style={{ color: COLORS.text }}>
            شما و {matchedUser.name}
          </Text>
          <Text className="text-sm text-center mb-6 px-2" style={{ color: COLORS.textMuted }}>
            هر دو به یکدیگر ابراز علاقه کردید! اکنون می‌توانید با هم در ارتباط باشید.
          </Text>

          {/* بخش کپی آیدی ارتباطی */}
          {matchedUser.contactId && (
            <TouchableOpacity 
              onPress={handleCopy}
              className="w-full h-12 rounded-xl flex-row items-center justify-center gap-2 mb-3 border"
              style={{ backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.border }}
            >
              <Feather name={copied ? "check" : "copy"} size={16} color={copied ? '#10B981' : COLORS.accentSoft} />
              <Text style={{ color: copied ? '#10B981' : COLORS.text }} className="font-bold text-sm">
                {copied ? 'آیدی کپی شد!' : `کپی آیدی: ${matchedUser.contactId}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* دکمه انتقال مستقیم به صفحه چت / مچ‌ها */}
          <TouchableOpacity 
            className="w-full h-14 rounded-2xl items-center justify-center flex-row gap-2 mb-3"
            style={{ backgroundColor: COLORS.accent }}
            onPress={onGoToChat}
          >
            <Feather name="message-circle" size={20} color="#FFFFFF" />
            <Text className="text-white font-bold text-base">رفتن به بخش مکالمات</Text>
          </TouchableOpacity>

          {/* بستن مودال و ادامه مرور افراد */}
          <TouchableOpacity 
            className="w-full h-11 rounded-2xl items-center justify-center"
            onPress={onClose}
          >
            <Text className="font-semibold text-sm" style={{ color: COLORS.textMuted }}>ادامه مرور افراد</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ActionButton = ({ icon, color, onPress, isLarge = false, disabled = false }: any) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const size = isLarge ? 64 : 50;

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => { if (!disabled) scale.value = withSpring(0.92); }}
      onPressOut={() => { if (!disabled) scale.value = withSpring(1); }}
      onPress={() => {
        if (!disabled) {
          triggerHaptic('light');
          onPress();
        }
      }}
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
            opacity: disabled ? 0.4 : 1,
            elevation: disabled ? 0 : 8 
          }
        ]}
      >
        {icon}
      </Animated.View>
    </Pressable>
  );
};

const BackgroundCard = ({ user, dragX }: { user: User; dragX: SharedValue<number> }) => {
  const userEmoji = EMOJIS[user.id.charCodeAt(0) % EMOJIS.length];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(dragX.value),
      [0, SWIPE_THRESHOLD],
      [0.92, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      Math.abs(dragX.value),
      [0, SWIPE_THRESHOLD],
      [14, 0],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      Math.abs(dragX.value),
      [0, SWIPE_THRESHOLD],
      [0.65, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  return (
    <Animated.View style={[animatedStyle, { position: 'absolute', zIndex: 0, width: '100%', alignItems: 'center' }]}>
      <View 
        style={{ 
          width: CARD_WIDTH, 
          height: CARD_HEIGHT, 
          backgroundColor: COLORS.surface, 
          borderWidth: 1, 
          borderColor: COLORS.border,
          borderRadius: 36,
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
  );
};

const SwipeableCard = ({ user, onSwipeOut, externalSwipeDirection, dragX }: any) => {
  const translateX = dragX;
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
        runOnJS(triggerHaptic)('medium');
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
      <Animated.View style={[animatedStyle, { position: 'absolute', zIndex: 1, width: '100%', alignItems: 'center' }]}>
        <View 
          style={{ 
            width: CARD_WIDTH, 
            height: CARD_HEIGHT, 
            backgroundColor: COLORS.surface, 
            borderWidth: 1, 
            borderColor: COLORS.border,
            borderRadius: 36,
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
  const [history, setHistory] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [externalDirection, setExternalDirection] = useState<'LIKE' | 'PASS' | null>(null);

  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  const dragX = useSharedValue(0);

  const fetchDiscoveryUsers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return router.replace('/');
      const response = await apiClient.get('/users/discovery', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(response.data);
      setHistory([]);
    } catch (error) {
      console.error('Fetch discovery error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDiscoveryUsers(); }, []);

  const handleSwipeOut = async (type: 'LIKE' | 'PASS') => {
    if (users.length === 0) return;
    const swipedUser = users[0];

    setHistory((prev) => [swipedUser, ...prev]);
    setUsers((prev) => prev.slice(1));
    setExternalDirection(null);
    dragX.value = 0;

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await apiClient.post(
        '/users/swipe',
        { targetId: swipedUser.id, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.isMatch) {
        triggerHaptic('success');
        setMatchedUser(swipedUser);
        setMatchModalVisible(true);
      }
    } catch (error: any) {
      console.error('Swipe API Error:', error.response?.data || error.message);
    }
  };

  const handleRewind = () => {
    if (history.length === 0) return;
    triggerHaptic('medium');
    const lastUser = history[0];
    setHistory((prev) => prev.slice(1));
    setUsers((prev) => [lastUser, ...prev]);
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
        
        {/* Cards Viewport */}
        <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 36, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.accentSoft} />
            </View>
          ) : users.length > 0 ? (
            <View style={{ width: '100%', height: CARD_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
              {users.length > 1 && (
                <BackgroundCard user={users[1]} dragX={dragX} />
              )}
              <SwipeableCard 
                key={users[0].id} 
                user={users[0]} 
                dragX={dragX}
                externalSwipeDirection={externalDirection}
                onSwipeOut={(type: 'LIKE' | 'PASS') => handleSwipeOut(type)} 
              />
            </View>
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

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, height: 72 }}>
          {!loading && (
            <>
              <ActionButton 
                icon={<MaterialCommunityIcons name="undo-variant" size={22} color={COLORS.rewind} />} 
                color={COLORS.rewind}
                disabled={history.length === 0}
                onPress={handleRewind} 
              />
              {users.length > 0 && (
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
            </>
          )}
        </View>

        {/* Modal اختصاصی مچ */}
        <MatchModal 
          visible={matchModalVisible}
          matchedUser={matchedUser}
          onClose={() => setMatchModalVisible(false)}
          onGoToChat={() => {
            setMatchModalVisible(false);
            router.push('/matches');
          }}
        />

      </View>
    </GestureHandlerRootView>
  );
}