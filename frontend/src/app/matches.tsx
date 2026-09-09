//matches.tsx
import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Clipboard, Pressable } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { Feather } from '@expo/vector-icons';

const EMOJIS = ['👽', '👻', '🤖', '👾', '🤡', '🤠', '😎', '🤓', '🦊', '🐱'];

type MatchedUser = {
  id: string;
  name: string;
  bio: string;
  phoneNumber: string;
  contactId: string | null;
  showPhoneNumber: boolean;
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
      if (!token) return router.replace('/');
      const response = await apiClient.get('/chat/matches', { headers: { Authorization: `Bearer ${token}` } });
      setMatches(response.data.slice(0, 10));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    Clipboard.setString(text);
    Alert.alert('کپی شد', `${type} در کلیپ‌بورد ذخیره شد.`);
  };

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-black">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );

  return (
    <View className="flex-1 bg-black px-6 pt-16 pb-8">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-8 px-2">
        <Text className="text-3xl font-extrabold text-white tracking-tight">Matches</Text>
        <TouchableOpacity onPress={() => router.replace('/home')} className="bg-[#1C1C1E] p-3 rounded-full">
          <Feather name="x" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {matches.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Feather name="users" size={48} color="#3A3A3C" className="mb-4" />
          <Text className="text-[#8E8E93] text-lg font-medium">هنوز مچی ندارید</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const userEmoji = EMOJIS[item.id.charCodeAt(0) % EMOJIS.length];
            return (
              <View className="bg-[#1C1C1E] p-6 rounded-[32px] mb-4">
                <View className="flex-row items-center mb-6">
                  <View className="w-16 h-16 bg-[#2C2C2E] rounded-full items-center justify-center mr-4">
                    <Text className="text-3xl">{userEmoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-2xl font-bold tracking-wide">{item.name}</Text>
                    <Text className="text-[#8E8E93] text-sm mt-1 leading-5">{item.bio || 'بدون بیوگرافی'}</Text>
                  </View>
                </View>

                <View className="flex-row space-x-3 space-x-reverse">
                  {item.contactId && (
                    <Pressable
                      className="flex-1 bg-[#32ADE6]/10 py-3.5 rounded-2xl items-center flex-row justify-center space-x-2"
                      onPress={() => copyToClipboard(item.contactId!, 'آیدی')}
                    >
                      <Feather name="at-sign" size={16} color="#32ADE6" />
                      <Text className="text-[#32ADE6] font-bold">{item.contactId}</Text>
                    </Pressable>
                  )}

                  {item.showPhoneNumber ? (
                    <Pressable
                      className="flex-1 bg-[#2C2C2E] py-3.5 rounded-2xl items-center flex-row justify-center space-x-2"
                      onPress={() => copyToClipboard(item.phoneNumber, 'شماره تماس')}
                    >
                      <Feather name="phone" size={16} color="#FFFFFF" />
                      <Text className="text-white font-bold">{item.phoneNumber}</Text>
                    </Pressable>
                  ) : (
                    <View className="flex-1 bg-[#2C2C2E]/50 py-3.5 rounded-2xl items-center flex-row justify-center space-x-2">
                      <Feather name="phone-off" size={16} color="#8E8E93" />
                      <Text className="text-[#8E8E93] text-sm font-medium">مخفی</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}