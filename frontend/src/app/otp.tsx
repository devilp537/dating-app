import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function OTPScreen() {
  const { phone } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length < 5) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post('/users/verify', {
        phoneNumber: phone,
        otp: code,
      });

      // ذخیره توکن در حافظه دستگاه
      await AsyncStorage.setItem('userToken', response.data.token);
      
      // هدایت به صفحه اصلی و حذف تاریخچه صفحات لاگین
      router.replace('./home'); 
      
    } catch (error: any) {
      Alert.alert('خطا', 'کد وارد شده اشتباه است');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-zinc-900">
      <TouchableOpacity 
        onPress={() => router.back()} 
        className="absolute top-12 left-6"
      >
        <Text className="text-teal-400 text-lg">← Back</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-white mb-4">Verify Phone</Text>
      <Text className="text-gray-400 mb-8">
        Enter the 5-digit code sent to {phone}
      </Text>

      <TextInput
        className="w-full bg-zinc-800 text-white text-center text-2xl tracking-[1em] rounded-xl px-4 py-4 mb-8 border border-zinc-700"
        placeholder="00000"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        maxLength={5}
        value={code}
        onChangeText={setCode}
      />

      <TouchableOpacity
        onPress={handleVerify}
        disabled={isLoading}
        className={`w-full rounded-xl py-4 items-center ${isLoading ? 'bg-teal-700' : 'bg-teal-500'}`}
      >
        <Text className="text-white font-bold text-lg">
          {isLoading ? 'Verifying...' : 'Verify & Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}