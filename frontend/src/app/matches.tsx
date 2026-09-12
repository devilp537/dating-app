import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { Feather } from '@expo/vector-icons';

const COLORS = { 
  bg: '#000000', 
  surface: '#111018', 
  surfaceAlt: '#181622', 
  border: 'rgba(167,139,250,0.18)', 
  accent: '#8B5CF6', 
  accentSoft: '#A78BFA', 
  text: '#F5F3FF', 
  textMuted: '#8B879A' 
};

const EMOJIS = ['👽', '👻', '🤖', '👾', '🤡', '😎', '🤓', '🦊'];

export default function MatchesScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return router.replace('/');
      const res = await apiClient.get('/chat/matches', { headers: { Authorization: `Bearer ${token}` } });
      setMatches(res.data.slice(0, 10));
    } catch {
      // خطاها می‌توانند اینجا هندل شوند
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const copy = (t: string, type: string) => { 
    Clipboard.setString(t); 
    Alert.alert('کپی شد', `${type} در کلیپ‌بورد ذخیره شد.`); 
  };

  return (
    <View className="flex-1 px-5 pt-12 pb-8" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold tracking-wider" style={{ color: COLORS.text }}>MATCHES</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={fetchMatches} className="p-2.5 rounded-2xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <Feather name="refresh-cw" size={18} color={COLORS.accentSoft} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/home')} className="p-2.5 rounded-2xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <Feather name="chevron-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={COLORS.accentSoft} size="large" />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Feather name="users" size={44} color={COLORS.textMuted} className="mb-4" />
              <Text style={{ color: COLORS.textMuted }} className="mb-6 text-base font-medium">مچی یافت نشد</Text>
              <TouchableOpacity className="px-5 py-2.5 rounded-xl flex-row items-center gap-2 border" style={{ backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.border }} onPress={fetchMatches}>
                <Feather name="refresh-cw" size={15} color={COLORS.accentSoft} />
                <Text style={{ color: COLORS.accentSoft }} className="font-bold text-sm">تلاش مجدد</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            // استخراج اطلاعات کاربر مقابل از داخل آبجکت user که از بک‌اند می‌آید
            const targetUser = item.user;
            
            // بررسی امنیتی برای نمایش شماره و آیدی
            const hasPhone = !!targetUser?.phoneNumber;
            const hasContactId = !!targetUser?.contactId;

            return (
              <View className="p-5 rounded-[24px] mb-4 border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                <View className="flex-row items-center mb-5">
                  <View className="w-14 h-14 rounded-full items-center justify-center mr-4" style={{ backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border }}>
                    <Text className="text-2xl">{EMOJIS[(targetUser?.id?.charCodeAt(0) || 0) % EMOJIS.length]}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>{targetUser?.name || 'کاربر ناشناس'}</Text>
                    <Text className="text-sm" style={{ color: COLORS.textMuted }} numberOfLines={1}>{targetUser?.bio || 'بدون بیوگرافی'}</Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  {hasContactId ? (
                    <TouchableOpacity 
                      className="flex-1 h-11 rounded-xl flex-row items-center justify-center gap-2 border" 
                      style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: COLORS.border }} 
                      onPress={() => copy(targetUser.contactId, 'آیدی')}
                    >
                      <Feather name="at-sign" size={15} color={COLORS.accentSoft} />
                      <Text style={{ color: COLORS.accentSoft }} className="font-bold text-sm">{targetUser.contactId}</Text>
                    </TouchableOpacity>
                  ) : null}
                  
                  <TouchableOpacity 
                    className="flex-1 h-11 rounded-xl flex-row items-center justify-center gap-2 border" 
                    style={{ backgroundColor: hasPhone ? COLORS.surfaceAlt : 'transparent', borderColor: COLORS.border }} 
                    onPress={() => hasPhone && copy(targetUser.phoneNumber, 'شماره')}
                  >
                    <Feather name={hasPhone ? "phone" : "phone-off"} size={15} color={hasPhone ? COLORS.text : COLORS.textMuted} />
                    <Text style={{ color: hasPhone ? COLORS.text : COLORS.textMuted }} className="font-bold text-sm">
                      {hasPhone ? targetUser.phoneNumber : 'مخفی'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}