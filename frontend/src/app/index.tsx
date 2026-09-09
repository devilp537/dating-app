//index.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('خطا', 'شماره تماس معتبر نیست');
      return;
    }

    setLoading(true);
    try {
      // استفاده از متد POST و ارسال بادی (body)
      await apiClient.post('/users/login', { phoneNumber });
      setStep('OTP');
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ارتباط با سرور پیش آمد');
    } finally {
      setLoading(false);
    }
  };

const handleVerifyOtp = async () => {
    if (otp.length < 5) {
      Alert.alert('خطا', 'کد تایید نامعتبر است');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/users/verify', { phoneNumber, otp });
      
      const token = response.data.token;
      const user = response.data.user; // دریافت اطلاعات کاربر از رسپانس لاگین
      
      if (token && typeof token === 'string' && token !== 'null' && token !== 'undefined') {
        console.log('Token is valid and saved.');
        await AsyncStorage.setItem('userToken', token);
        
        // اگر نام کاربر هنوز "کاربر جدید" است یا جنسیت ندارد، برو به Onboarding
        if (user.name === 'کاربر جدید' || !user.gender) {
          router.replace('/onboarding');
        } else {
          router.replace('/home');
        }
      } else {
        Alert.alert('خطا', 'توکن معتبری از سرور دریافت نشد!');
      }

    } catch (error) {
      Alert.alert('خطا', 'کد تایید اشتباه است یا سرور در دسترس نیست');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-zinc-900 justify-center px-8">
      <View className="mb-12">
        <Text className="text-4xl font-bold text-teal-400 mb-2">Lovable</Text>
        <Text className="text-zinc-500 text-lg">
          {step === 'PHONE' ? 'برای شروع شماره خود را وارد کنید' : 'کد پیامک شده را وارد کنید'}
        </Text>
      </View>

      {step === 'PHONE' ? (
        <View className="space-y-4">
          <TextInput
            className="w-full bg-zinc-800 text-white px-4 py-4 rounded-xl border border-zinc-700 text-lg"
            placeholder="مثال: 09123456789"
            placeholderTextColor="#71717a"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TouchableOpacity 
            className="w-full bg-teal-500 py-4 rounded-xl items-center flex-row justify-center"
            onPress={handleRequestOtp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" className="mr-2" /> : null}
            <Text className="text-white font-bold text-lg">دریافت کد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="space-y-4">
          <TextInput
            className="w-full bg-zinc-800 text-white px-4 py-4 rounded-xl border border-zinc-700 text-lg text-center tracking-[10px]"
            placeholder="12345"
            placeholderTextColor="#71717a"
            keyboardType="number-pad"
            maxLength={5}
            value={otp}
            onChangeText={setOtp}
          />
          <TouchableOpacity 
            className="w-full bg-teal-500 py-4 rounded-xl items-center flex-row justify-center"
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" className="mr-2" /> : null}
            <Text className="text-white font-bold text-lg">ورود</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="mt-4 items-center p-2"
            onPress={() => setStep('PHONE')}
          >
            <Text className="text-zinc-400">تغییر شماره</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}