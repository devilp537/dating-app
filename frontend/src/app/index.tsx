import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../api/client';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (phone.length < 10) return;
    
    setIsLoading(true);
    try {
      // ارسال درخواست تولید OTP به بک‌اند
      await apiClient.post('/users/login', { phoneNumber: phone });
      router.push({ pathname: '/otp', params: { phone } });
    } catch (error) {
      Alert.alert('Error', 'مشکلی در ارسال کد پیش آمد. سرور روشن است؟');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-zinc-900">
      <View className="mb-10 items-center">
        <Text className="text-4xl font-bold text-teal-400 mb-2">Dating App</Text>
        <Text className="text-gray-400 text-base">Find your perfect match</Text>
      </View>

      <Text className="text-white mb-2 ml-1 text-sm">Phone Number</Text>
      <TextInput
        className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 mb-6 border border-zinc-700"
        placeholder="Enter your mobile number"
        placeholderTextColor="#9ca3af"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        className={`w-full rounded-xl py-4 items-center ${isLoading ? 'bg-teal-700' : 'bg-teal-500'}`}
      >
        <Text className="text-white font-bold text-lg">
          {isLoading ? 'Sending...' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}