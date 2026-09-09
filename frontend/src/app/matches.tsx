import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { Feather } from '@expo/vector-icons';

const COLORS = { bg: '#09090B', surface: '#18181B', border: '#27272A', accent: '#8B5CF6', text: '#FAFAFA', muted: '#A1A1AA' };
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
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const copy = (t: string, type: string) => { Clipboard.setString(t); Alert.alert('کپی شد', `${type} کپی شد.`); };

  return (
    <View className="flex-1 px-5 pt-14 pb-8" style={{ backgroundColor: COLORS.bg }}>
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold" style={{ color: COLORS.text }}>Matches</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={fetchMatches} className="p-2.5 rounded-2xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <Feather name="refresh-cw" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/home')} className="p-2.5 rounded-2xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <Feather name="chevron-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
         <View className="flex-1 items-center justify-center"><ActivityIndicator color={COLORS.accent} size="large" /></View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Feather name="users" size={48} color={COLORS.muted} className="mb-4" />
              <Text style={{ color: COLORS.muted }} className="mb-6">مچی ندارید</Text>
              <TouchableOpacity className="px-6 py-3 rounded-2xl flex-row items-center gap-2" style={{ backgroundColor: COLORS.border }} onPress={fetchMatches}>
                <Feather name="refresh-cw" size={16} color={COLORS.text} />
                <Text style={{ color: COLORS.text }} className="font-bold">تلاش مجدد</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View className="p-5 rounded-[24px] mb-4 border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
              <View className="flex-row items-center mb-5">
                <View className="w-14 h-14 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#27272A' }}>
                  <Text className="text-2xl">{EMOJIS[item.id.charCodeAt(0) % EMOJIS.length]}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>{item.name}</Text>
                  <Text className="text-sm" style={{ color: COLORS.muted }} numberOfLines={1}>{item.bio || 'بدون بیوگرافی'}</Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                {item.contactId && (
                  <TouchableOpacity className="flex-1 h-12 rounded-xl flex-row items-center justify-center gap-2" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }} onPress={() => copy(item.contactId, 'آیدی')}>
                    <Feather name="at-sign" size={16} color={COLORS.accent} />
                    <Text style={{ color: COLORS.accent }} className="font-bold text-sm">{item.contactId}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity className="flex-1 h-12 rounded-xl flex-row items-center justify-center gap-2" style={{ backgroundColor: item.showPhoneNumber ? '#27272A' : 'transparent', borderWidth: item.showPhoneNumber ? 0 : 1, borderColor: COLORS.border }} onPress={() => item.showPhoneNumber && copy(item.phoneNumber, 'شماره')}>
                  <Feather name={item.showPhoneNumber ? "phone" : "phone-off"} size={16} color={item.showPhoneNumber ? COLORS.text : COLORS.muted} />
                  <Text style={{ color: item.showPhoneNumber ? COLORS.text : COLORS.muted }} className="font-bold text-sm">{item.showPhoneNumber ? item.phoneNumber : 'مخفی'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}