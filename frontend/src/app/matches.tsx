import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

type MatchedUser = {
  id: string;
  name: string;
  bio: string;
  phoneNumber: string;
};

export default function MatchesScreen() {
  const [matches, setMatches] = useState<MatchedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await apiClient.get('/chat/matches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data);
    } catch (error) {
      console.error('خطا در دریافت لیست مچ‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyPhoneNumber = (phone: string) => {
    Clipboard.setString(phone);
    Alert.alert('کپی شد! 📋', `شماره ${phone} در کلیپ‌بورد ذخیره شد.`);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900">
        <ActivityIndicator size="large" color="#2dd4bf" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-900 px-6 pt-16 pb-8">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-teal-400">مچ‌های شما 🎉</Text>
        <TouchableOpacity onPress={() => router.replace('/home')}>
          <Text className="text-zinc-400 font-bold">بازگشت</Text>
        </TouchableOpacity>
      </View>

      {matches.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-500 text-lg text-center">هنوز مچی ندارید! به سوایپ کردن ادامه دهید.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-zinc-800 p-5 rounded-2xl mb-4 border border-zinc-700">
              <Text className="text-white text-xl font-bold mb-1">{item.name}</Text>
              <Text className="text-zinc-400 text-sm mb-3">{item.bio || 'بیوگرافی ثبت نشده'}</Text>
              
              <TouchableOpacity 
                className="bg-teal-500/20 border border-teal-500/50 py-3 rounded-xl items-center flex-row justify-center space-x-2"
                onPress={() => copyPhoneNumber(item.phoneNumber)}
              >
                <Text className="text-teal-400 font-bold text-base">شماره تماس: {item.phoneNumber}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}