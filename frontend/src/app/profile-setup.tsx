import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('MALE'); // پیش‌فرض
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('خطا', 'لطفاً نام خود را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await apiClient.put(
        '/users/profile',
        { name, bio, gender },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('موفق', 'پروفایل شما تکمیل شد!');
      router.replace('/home');
    } catch (error) {
      console.error(error);
      Alert.alert('خطا', 'مشکلی در ارتباط با سرور پیش آمد.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-zinc-900 px-6 pt-16">
      <Text className="text-3xl font-bold text-white mb-2">Complete Profile</Text>
      <Text className="text-gray-400 mb-8">Let's set up your basic information.</Text>

      <Text className="text-white mb-2 ml-1 text-sm">Full Name</Text>
      <TextInput
        className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 mb-6 border border-zinc-700"
        placeholder="Enter your name"
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
      />

      <Text className="text-white mb-2 ml-1 text-sm">Bio</Text>
      <TextInput
        className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 mb-6 border border-zinc-700 h-24 text-top"
        placeholder="Tell us about yourself..."
        placeholderTextColor="#9ca3af"
        multiline
        numberOfLines={4}
        value={bio}
        onChangeText={setBio}
        textAlignVertical="top"
      />

      <Text className="text-white mb-2 ml-1 text-sm">Gender</Text>
      <View className="flex-row justify-between mb-10">
        <TouchableOpacity
          onPress={() => setGender('MALE')}
          className={`flex-1 py-3 items-center rounded-xl border mr-2 ${
            gender === 'MALE' ? 'bg-teal-500 border-teal-500' : 'bg-zinc-800 border-zinc-700'
          }`}
        >
          <Text className={`font-bold ${gender === 'MALE' ? 'text-white' : 'text-gray-400'}`}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setGender('FEMALE')}
          className={`flex-1 py-3 items-center rounded-xl border ml-2 ${
            gender === 'FEMALE' ? 'bg-teal-500 border-teal-500' : 'bg-zinc-800 border-zinc-700'
          }`}
        >
          <Text className={`font-bold ${gender === 'FEMALE' ? 'text-white' : 'text-gray-400'}`}>Female</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSaveProfile}
        disabled={isLoading}
        className={`w-full rounded-xl py-4 items-center mb-10 ${isLoading ? 'bg-teal-700' : 'bg-teal-500'}`}
      >
        <Text className="text-white font-bold text-lg">
          {isLoading ? 'Saving...' : 'Save & Continue'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}