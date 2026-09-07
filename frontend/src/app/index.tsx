import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');

  const handleLogin = () => {
    if (phone.length < 10) return; // ساده‌سازی اعتبارسنجی
    
    // فعلاً مسیر را به صفحه OTP تغییر می‌دهیم تا UI را تست کنیم
    // بعداً درخواست Axios به بک‌اند در اینجا قرار می‌گیرد
    router.push({ pathname: '/otp', params: { phone } });
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
        className="w-full bg-teal-500 rounded-xl py-4 items-center"
      >
        <Text className="text-white font-bold text-lg">Continue</Text>
      </TouchableOpacity>
    </View>
  );
}