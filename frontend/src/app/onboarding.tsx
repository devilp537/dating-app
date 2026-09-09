import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { Feather } from '@expo/vector-icons';

const COLORS = { bg: '#09090B', surface: '#18181B', border: '#27272A', accent: '#8B5CF6', text: '#FAFAFA', muted: '#A1A1AA' };

export default function OnboardingScreen() {
  const [form, setForm] = useState({ name: '', bio: '', contactId: '', gender: null as 'MALE' | 'FEMALE' | null, showPhone: false });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.gender) return Alert.alert('خطا', 'نام و جنسیت الزامی است');
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await apiClient.put('/users/profile', { name: form.name, bio: form.bio, gender: form.gender, contactId: form.contactId, showPhoneNumber: form.showPhone }, { headers: { Authorization: `Bearer ${token}` } });
      router.replace('/home');
    } catch {
      Alert.alert('خطا', 'ثبت اطلاعات ناموفق بود');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView className="flex-1 px-6 pt-16" style={{ backgroundColor: COLORS.bg }} showsVerticalScrollIndicator={false}>
      <View className="mb-8">
        <Text className="text-3xl font-bold mb-2" style={{ color: COLORS.text }}>پروفایل شما</Text>
        <Text style={{ color: COLORS.muted }}>اطلاعات خود را کامل کنید تا بهتر دیده شوید.</Text>
      </View>

      <View className="gap-6 pb-12">
        <View>
          <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>نام شما</Text>
          <TextInput className="h-14 px-4 rounded-2xl text-base" style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border }} placeholder="مثال: علی" placeholderTextColor={COLORS.muted} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
        </View>

        <View>
          <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>جنسیت</Text>
          <View className="flex-row gap-3">
            {(['MALE', 'FEMALE'] as const).map((g) => (
              <TouchableOpacity key={g} className="flex-1 h-14 rounded-2xl items-center justify-center border" style={{ backgroundColor: form.gender === g ? COLORS.accent : COLORS.surface, borderColor: form.gender === g ? COLORS.accent : COLORS.border }} onPress={() => setForm({ ...form, gender: g })}>
                <Text className="font-bold text-base" style={{ color: form.gender === g ? '#FFF' : COLORS.muted }}>{g === 'MALE' ? 'مرد' : 'زن'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>آیدی ارتباطی</Text>
          <TextInput className="h-14 px-4 rounded-2xl text-base" style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border }} placeholder="@username" placeholderTextColor={COLORS.muted} autoCapitalize="none" value={form.contactId} onChangeText={(t) => setForm({ ...form, contactId: t })} />
        </View>

        <View className="flex-row items-center justify-between px-4 py-4 rounded-2xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
          <View className="flex-1">
            <Text className="font-bold text-base mb-1" style={{ color: COLORS.text }}>نمایش شماره</Text>
            <Text className="text-xs" style={{ color: COLORS.muted }}>شماره به مچ‌ها نمایش داده شود.</Text>
          </View>
          <Switch trackColor={{ false: COLORS.border, true: COLORS.accent }} thumbColor="#FFF" value={form.showPhone} onValueChange={(v) => setForm({ ...form, showPhone: v })} />
        </View>

        <View>
          <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>بیوگرافی (اختیاری)</Text>
          <TextInput className="px-4 py-4 rounded-2xl text-base min-h-[100px]" style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border }} placeholder="درباره خودتان..." placeholderTextColor={COLORS.muted} multiline textAlignVertical="top" value={form.bio} onChangeText={(t) => setForm({ ...form, bio: t })} />
        </View>

        <TouchableOpacity className="h-14 rounded-2xl items-center flex-row justify-center mt-2" style={{ backgroundColor: COLORS.accent }} onPress={submit} disabled={loading}>
          {loading && <ActivityIndicator color="#FFF" style={{ marginLeft: 8 }} />}
          <Text className="font-bold text-lg text-white">شروع برنامه</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}