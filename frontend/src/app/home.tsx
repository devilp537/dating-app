import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  
  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    router.replace('/');
  };

  return (
    <View className="flex-1 items-center justify-center bg-zinc-900">
      <Text className="text-3xl font-bold text-teal-400 mb-8">Welcome Home! 🚀</Text>
      
      <TouchableOpacity 
        onPress={handleLogout}
        className="bg-zinc-800 px-8 py-4 rounded-xl border border-zinc-700"
      >
        <Text className="text-red-400 font-bold text-lg">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}