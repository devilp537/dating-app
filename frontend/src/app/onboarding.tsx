import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim() || !gender) {
      Alert.alert('خطا', 'لطفاً نام و جنسیت خود را مشخص کنید.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
        return;
      }

      await apiClient.put('/users/profile', 
        { name, bio, gender },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // پس از ذخیره موفق، کاربر را به صفحه دیسکاوری بفرست
      router.replace('/home');
    } catch (error) {
      console.error('خطا در ذخیره پروفایل:', error);
      Alert.alert('خطا', 'مشکلی در ذخیره اطلاعات پیش آمد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-900 px-6 pt-16 pb-8">
      <View className="mb-10">
        <Text className="text-3xl font-bold text-white mb-2">تکمیل پروفایل</Text>
        <Text className="text-zinc-400">کمی درباره خودتان بگویید تا شما را به دیگران معرفی کنیم.</Text>
      </View>

      <View className="space-y-6 flex-1">
        <View>
          <Text className="text-zinc-300 mb-2 font-bold">نام شما</Text>
          <TextInput
            className="w-full bg-zinc-800 text-white px-4 py-4 rounded-xl border border-zinc-700 text-lg"
            placeholder="مثال: علی"
            placeholderTextColor="#71717a"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View>
          <Text className="text-zinc-300 mb-2 font-bold">جنسیت</Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity 
              className={`flex-1 py-4 rounded-xl items-center border ${gender === 'MALE' ? 'bg-teal-500/20 border-teal-500' : 'bg-zinc-800 border-zinc-700'}`}
              onPress={() => setGender('MALE')}
            >
              <Text className={gender === 'MALE' ? 'text-teal-400 font-bold' : 'text-zinc-400'}>مرد</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`flex-1 py-4 rounded-xl items-center border ${gender === 'FEMALE' ? 'bg-teal-500/20 border-teal-500' : 'bg-zinc-800 border-zinc-700'}`}
              onPress={() => setGender('FEMALE')}
            >
              <Text className={gender === 'FEMALE' ? 'text-teal-400 font-bold' : 'text-zinc-400'}>زن</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text className="text-zinc-300 mb-2 font-bold">بیوگرافی کوتاه (اختیاری)</Text>
          <TextInput
            className="w-full bg-zinc-800 text-white px-4 py-4 rounded-xl border border-zinc-700 text-lg"
            placeholder="درباره علایق خود بنویسید..."
            placeholderTextColor="#71717a"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={bio}
            onChangeText={setBio}
          />
        </View>
      </View>

      <TouchableOpacity 
        className="w-full bg-teal-500 py-4 rounded-xl items-center flex-row justify-center mt-auto"
        onPress={handleSaveProfile}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" className="mr-2" /> : null}
        <Text className="text-white font-bold text-lg">ثبت و ورود</Text>
      </TouchableOpacity>
    </View>
  );
}