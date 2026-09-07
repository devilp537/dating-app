import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams();
  const [code, setCode] = useState('');

  const handleVerify = () => {
    // در اینجا توکن تایید شده و کاربر به صفحه اصلی اپلیکیشن هدایت می‌شود
    console.log(`Verifying code ${code} for phone ${phone}`);
    // router.replace('/home'); // صفحه Home را بعداً می‌سازیم
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
        Enter the 4-digit code sent to {phone}
      </Text>

      <TextInput
        className="w-full bg-zinc-800 text-white text-center text-2xl tracking-[1em] rounded-xl px-4 py-4 mb-8 border border-zinc-700"
        placeholder="0000"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        maxLength={4}
        value={code}
        onChangeText={setCode}
      />

      <TouchableOpacity
        onPress={handleVerify}
        className="w-full bg-teal-500 rounded-xl py-4 items-center"
      >
        <Text className="text-white font-bold text-lg">Verify & Login</Text>
      </TouchableOpacity>
    </View>
  );
}