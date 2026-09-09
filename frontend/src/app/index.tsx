import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { Feather } from '@expo/vector-icons';

const COLORS = { bg: '#09090B', surface: '#18181B', border: '#27272A', accent: '#8B5CF6', text: '#FAFAFA', muted: '#A1A1AA' };

// برای غیرفعال کردن outline پیش‌فرض مرورگر در حالت وب
const styles = StyleSheet.create({
  noOutline: {
    outlineStyle: 'none'
  } as any
});

function OtpInput({ value, length = 5 }: { value: string, length?: number }) {
  return (
    <View className="flex-row justify-center w-full" style={{ direction: 'ltr' }}>
      {Array.from({ length }).map((_, i) => (
        <View 
          key={i} 
          className="flex-1 h-16 justify-center items-center rounded-2xl mx-1.5" 
          style={{ 
            backgroundColor: COLORS.surface, 
            borderWidth: 1, 
            borderColor: i === value.length ? COLORS.accent : COLORS.border,
            maxWidth: 65 // این مقدار از بزرگ شدن بیش از حد کادرها در صفحات عریض جلوگیری می‌کند
          }}
        >
          <Text className="text-2xl font-bold" style={{ color: COLORS.text }}>{value[i] || ''}</Text>
        </View>
      ))}
    </View>
  );
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const handleRequest = async () => {
    if (phone.length < 10) return Alert.alert('خطا', 'شماره معتبر نیست');
    setLoading(true);
    try {
      await apiClient.post('/users/login', { phoneNumber: phone });
      setStep('OTP');
    } catch {
      Alert.alert('خطا', 'ارتباط با سرور برقرار نشد');
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (otp.length < 5) return Alert.alert('خطا', 'کد کامل نیست');
    setLoading(true);
    try {
      const res = await apiClient.post('/users/verify', { phoneNumber: phone, otp });
      if (res.data.token) {
        await AsyncStorage.setItem('userToken', res.data.token);
        router.replace((res.data.user.name === 'کاربر جدید' || !res.data.user.gender) ? '/onboarding' : '/home');
      }
    } catch {
      Alert.alert('خطا', 'کد اشتباه است');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView className="flex-1 px-6 justify-center" style={{ backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="items-center mb-16 -mt-10">
        <View className="w-16 h-16 rounded-3xl items-center justify-center mb-8" style={{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }}>
          <Feather name="heart" size={28} color={COLORS.accent} />
        </View>
        <Text className="text-3xl font-bold mb-3" style={{ color: COLORS.text }}>Lovable</Text>
        <Text className="text-base" style={{ color: COLORS.muted }}>{step === 'PHONE' ? 'شماره موبایل خود را وارد کنید' : 'کد تایید را وارد کنید'}</Text>
      </View>

      {step === 'PHONE' ? (
        <View className="gap-6">
          <View className="h-14 px-4 rounded-2xl flex-row items-center" style={{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }}>
            <Feather name="phone" size={20} color={COLORS.muted} />
            <TextInput 
              className="flex-1 h-full px-3 text-base text-right" 
              style={[{ color: COLORS.text }, styles.noOutline]} 
              placeholder="09123456789" 
              placeholderTextColor={COLORS.muted} 
              keyboardType="phone-pad" 
              value={phone} 
              onChangeText={setPhone} 
            />
          </View>
          <TouchableOpacity className="h-14 rounded-2xl items-center justify-center flex-row" style={{ backgroundColor: COLORS.accent }} onPress={handleRequest} disabled={loading}>
            {loading && <ActivityIndicator color="#fff" style={{ marginLeft: 8 }} />}
            <Text className="text-white font-bold text-lg">دریافت کد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="gap-6">
          <TouchableOpacity activeOpacity={1} onPress={() => otpRef.current?.focus()}>
            <OtpInput value={otp} />
            <TextInput 
              ref={otpRef} 
              autoFocus 
              value={otp} 
              onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ''))} 
              keyboardType="number-pad" 
              maxLength={5} 
              style={[{ position: 'absolute', opacity: 0, width: 1, height: 1 }, styles.noOutline]} 
            />
          </TouchableOpacity>
          <TouchableOpacity className="h-14 rounded-2xl items-center justify-center flex-row" style={{ backgroundColor: COLORS.accent }} onPress={handleVerify} disabled={loading}>
            {loading && <ActivityIndicator color="#fff" style={{ marginLeft: 8 }} />}
            <Text className="text-white font-bold text-lg">ورود</Text>
          </TouchableOpacity>
          <TouchableOpacity className="items-center" onPress={() => setStep('PHONE')}>
            <Text style={{ color: COLORS.muted }}>تغییر شماره</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}