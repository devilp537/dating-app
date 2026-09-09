//onboarding.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch, Pressable } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { Feather } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [contactId, setContactId] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim() || !gender) {
      Alert.alert('خطا', 'لطفاً نام و جنسیت خود را مشخص کنید.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return router.replace('/');
      await apiClient.put('/users/profile', 
        { name, bio, gender, contactId, showPhoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.replace('/home');
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ذخیره اطلاعات پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black px-6 pt-16" showsVerticalScrollIndicator={false}>
      <View className="mb-10 mt-4">
        <View className="w-16 h-16 bg-[#1C1C1E] rounded-full items-center justify-center mb-6">
          <Feather name="user" size={28} color="#FFFFFF" />
        </View>
        <Text className="text-4xl font-extrabold text-white tracking-tight mb-2">پروفایل شما</Text>
        <Text className="text-[#8E8E93] text-base leading-6">جزئیات را تکمیل کنید تا افراد مناسب‌تری به شما پیشنهاد دهیم.</Text>
      </View>

      <View className="space-y-6 pb-12">
        <View>
          <Text className="text-[#8E8E93] mb-3 font-medium ml-1 text-sm">نام شما</Text>
          <TextInput
            className="w-full bg-[#1C1C1E] text-white px-6 py-5 rounded-[24px] text-lg font-medium"
            placeholder="مثال: علی"
            placeholderTextColor="#3A3A3C"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View>
          <Text className="text-[#8E8E93] mb-3 font-medium ml-1 text-sm">جنسیت</Text>
          <View className="flex-row space-x-3">
            <Pressable 
              className={`flex-1 py-5 rounded-[24px] items-center ${gender === 'MALE' ? 'bg-[#32ADE6]' : 'bg-[#1C1C1E]'}`}
              onPress={() => setGender('MALE')}
            >
              <Text className={`${gender === 'MALE' ? 'text-white' : 'text-[#8E8E93]'} font-bold text-lg`}>مرد</Text>
            </Pressable>
            <Pressable 
              className={`flex-1 py-5 rounded-[24px] items-center ${gender === 'FEMALE' ? 'bg-[#32ADE6]' : 'bg-[#1C1C1E]'}`}
              onPress={() => setGender('FEMALE')}
            >
              <Text className={`${gender === 'FEMALE' ? 'text-white' : 'text-[#8E8E93]'} font-bold text-lg`}>زن</Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text className="text-[#8E8E93] mb-3 font-medium ml-1 text-sm">آیدی ارتباطی (تلگرام/اینستاگرام)</Text>
          <TextInput
            className="w-full bg-[#1C1C1E] text-white px-6 py-5 rounded-[24px] text-lg font-medium"
            placeholder="@username"
            placeholderTextColor="#3A3A3C"
            value={contactId}
            onChangeText={setContactId}
            autoCapitalize="none"
          />
        </View>

        <View className="flex-row items-center justify-between bg-[#1C1C1E] px-6 py-5 rounded-[24px]">
          <View className="flex-1 pr-4">
            <Text className="text-white font-bold text-lg mb-1">نمایش شماره تماس</Text>
            <Text className="text-[#8E8E93] text-xs leading-5">شماره شما به افرادی که با آن‌ها مچ می‌شوید نمایش داده شود.</Text>
          </View>
          <Switch
            trackColor={{ false: "#2C2C2E", true: "#32ADE6" }}
            thumbColor={"#FFFFFF"}
            onValueChange={setShowPhoneNumber}
            value={showPhoneNumber}
          />
        </View>

        <View>
          <Text className="text-[#8E8E93] mb-3 font-medium ml-1 text-sm">بیوگرافی (اختیاری)</Text>
          <TextInput
            className="w-full bg-[#1C1C1E] text-white px-6 py-5 rounded-[24px] text-lg font-medium leading-8"
            placeholder="درباره خودتان بنویسید..."
            placeholderTextColor="#3A3A3C"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={bio}
            onChangeText={setBio}
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-white py-5 rounded-[24px] items-center flex-row justify-center mt-4 mb-10 active:opacity-80"
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#000000" className="mr-2" /> : null}
          <Text className="text-black font-extrabold text-xl tracking-wide">شروع</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}