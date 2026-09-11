import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { Feather } from '@expo/vector-icons';

const COLORS = { bg: '#09090B', surface: '#18181B', border: '#27272A', accent: '#8B5CF6', accentSoft: '#A78BFA', text: '#FAFAFA', muted: '#A1A1AA' };

const PROVINCES = [
  'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز', 'ایلام', 'بوشهر', 'تهران', 
  'چهارمحال و بختیاری', 'خراسان جنوبی', 'خراسان رضوی', 'خراسان شمالی', 'خوزستان', 'زنجان', 
  'سمنان', 'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان', 'کرمان', 'کرمانشاه', 
  'کهگیلویه و بویراحمد', 'گلستان', 'گیلان', 'لرستان', 'مازندران', 'مرکزی', 'هرمزگان', 'همدان', 'یزد'
];

export default function OnboardingScreen() {
  const [form, setForm] = useState({ 
    name: '', 
    bio: '', 
    contactId: '', 
    gender: null as 'MALE' | 'FEMALE' | null, 
    showPhone: false,
    age: '',
    province: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.gender || !form.age || !form.province) {
      return Alert.alert('خطا', 'نام، جنسیت، سن و استان الزامی است');
    }
    
    const ageNum = parseInt(form.age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      return Alert.alert('خطا', 'لطفاً یک سن معتبر (بالای ۱۸ سال) وارد کنید');
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await apiClient.put('/users/profile', { 
        name: form.name, 
        bio: form.bio, 
        gender: form.gender, 
        contactId: form.contactId, 
        showPhoneNumber: form.showPhone,
        age: ageNum,
        province: form.province
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      router.replace('/home');
    } catch {
      Alert.alert('خطا', 'ثبت اطلاعات ناموفق بود');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <>
      <ScrollView className="flex-1 px-6 pt-16" style={{ backgroundColor: COLORS.bg }} showsVerticalScrollIndicator={false}>
        <View className="mb-8">
          <Text className="text-3xl font-bold mb-2" style={{ color: COLORS.text }}>پروفایل شما</Text>
          <Text style={{ color: COLORS.muted }}>اطلاعات خود را کامل کنید تا بهتر دیده شوید.</Text>
        </View>

        <View className="gap-6 pb-12">
          {/* نام */}
          <View>
            <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>نام شما</Text>
            <TextInput 
              className="h-14 px-4 rounded-2xl text-base" 
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border }} 
              placeholder="مثال: علی" 
              placeholderTextColor={COLORS.muted} 
              value={form.name} 
              onChangeText={(t) => setForm({ ...form, name: t })} 
            />
          </View>

          <View className="flex-row gap-4">
            {/* سن */}
            <View className="flex-1">
              <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>سن</Text>
              <TextInput 
                className="h-14 px-4 rounded-2xl text-base" 
                style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border }} 
                placeholder="مثال: 25" 
                placeholderTextColor={COLORS.muted} 
                keyboardType="number-pad"
                maxLength={2}
                value={form.age} 
                onChangeText={(t) => setForm({ ...form, age: t.replace(/[^0-9]/g, '') })} 
              />
            </View>

            {/* استان */}
            <View className="flex-[2]">
              <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>استان فعلی</Text>
              <TouchableOpacity 
                className="h-14 px-4 rounded-2xl flex-row items-center justify-between border" 
                style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                onPress={() => setProvinceModalVisible(true)}
              >
                <Text className="text-base" style={{ color: form.province ? COLORS.text : COLORS.muted }}>
                  {form.province || 'انتخاب استان'}
                </Text>
                <Feather name="chevron-down" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* جنسیت */}
          <View>
            <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>جنسیت</Text>
            <View className="flex-row gap-3">
              {(['MALE', 'FEMALE'] as const).map((g) => (
                <TouchableOpacity 
                  key={g} 
                  className="flex-1 h-14 rounded-2xl items-center justify-center border" 
                  style={{ backgroundColor: form.gender === g ? COLORS.accent : COLORS.surface, borderColor: form.gender === g ? COLORS.accent : COLORS.border }} 
                  onPress={() => setForm({ ...form, gender: g })}
                >
                  <Text className="font-bold text-base" style={{ color: form.gender === g ? '#FFF' : COLORS.muted }}>
                    {g === 'MALE' ? 'مرد' : 'زن'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* آیدی ارتباطی */}
          <View>
            <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>آیدی ارتباطی</Text>
            <TextInput 
              className="h-14 px-4 rounded-2xl text-base" 
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border }} 
              placeholder="@username" 
              placeholderTextColor={COLORS.muted} 
              autoCapitalize="none" 
              value={form.contactId} 
              onChangeText={(t) => setForm({ ...form, contactId: t })} 
            />
          </View>

          {/* نمایش شماره */}
          <View className="flex-row items-center justify-between px-4 py-4 rounded-2xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <View className="flex-1">
              <Text className="font-bold text-base mb-1" style={{ color: COLORS.text }}>نمایش شماره</Text>
              <Text className="text-xs" style={{ color: COLORS.muted }}>شماره به مچ‌ها نمایش داده شود.</Text>
            </View>
            <Switch 
              trackColor={{ false: COLORS.border, true: COLORS.accent }} 
              thumbColor="#FFF" 
              value={form.showPhone} 
              onValueChange={(v) => setForm({ ...form, showPhone: v })} 
            />
          </View>

          {/* بیوگرافی */}
          <View>
            <Text className="mb-2 text-sm ml-1" style={{ color: COLORS.muted }}>بیوگرافی (اختیاری)</Text>
            <TextInput 
              className="px-4 py-4 rounded-2xl text-base min-h-[100px]" 
              style={{ backgroundColor: COLORS.surface, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border }} 
              placeholder="درباره خودتان..." 
              placeholderTextColor={COLORS.muted} 
              multiline 
              textAlignVertical="top" 
              value={form.bio} 
              onChangeText={(t) => setForm({ ...form, bio: t })} 
            />
          </View>

          <TouchableOpacity 
            className="h-14 rounded-2xl items-center flex-row justify-center mt-2" 
            style={{ backgroundColor: COLORS.accent }} 
            onPress={submit} 
            disabled={loading}
          >
            {loading && <ActivityIndicator color="#FFF" style={{ marginLeft: 8 }} />}
            <Text className="font-bold text-lg text-white">شروع برنامه</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* مودال انتخاب استان */}
      <Modal visible={provinceModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="rounded-t-[32px] pt-4 pb-8 px-2 h-2/3" style={{ backgroundColor: COLORS.surface }}>
            <View className="flex-row justify-between items-center px-6 mb-4">
              <Text className="text-lg font-bold" style={{ color: COLORS.text }}>انتخاب استان</Text>
              <TouchableOpacity onPress={() => setProvinceModalVisible(false)} className="p-2">
                <Feather name="x" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PROVINCES}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="px-6 py-4 border-b" 
                  style={{ borderBottomColor: COLORS.border }}
                  onPress={() => {
                    setForm({ ...form, province: item });
                    setProvinceModalVisible(false);
                  }}
                >
                  <Text className="text-base" style={{ color: form.province === item ? COLORS.accentSoft : COLORS.text }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}