import { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '../api/client';
import { getToken } from '../utils/secureStorage'; // 🔒 استفاده از انبار امن

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
};

export default function ChatScreen() {
  const { id: otherUserId, name } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeChat();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const initializeChat = async () => {
    try {
      const token = await getToken();
      if (!token) {
        router.replace('/');
        return;
      }

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      setCurrentUserId(JSON.parse(jsonPayload).userId);

      await fetchMessages();
    } catch (error) {
      console.error('خطا در بارگذاری چت:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // apiClient خودش به طور خودکار هدر Authorization را تنظیم می‌کند
      const response = await apiClient.get(`/chat/messages/${otherUserId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('خطا در دریافت پیام‌ها:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!text.trim()) return;

    const messageText = text;
    setText('');

    try {
      const token = await getToken();
      if (!token) return;

      await apiClient.post('/chat/messages', {
        receiverId: otherUserId,
        text: messageText,
      });

      fetchMessages();
    } catch (error) {
      console.error('خطا در ارسال پیام:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900">
        <ActivityIndicator size="large" color="#2dd4bf" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-zinc-900"
    >
      <View className="flex-row items-center justify-between px-6 pt-16 pb-4 border-b border-zinc-800 bg-zinc-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-teal-400 font-bold">← بازگشت</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">{name || 'چت'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.senderId === currentUserId;
          return (
            <View className={`mb-3 max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
              <View className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-teal-500 rounded-br-none' : 'bg-zinc-800 rounded-bl-none border border-zinc-700'}`}>
                <Text className="text-white text-base">{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      <View className="p-4 bg-zinc-900 border-t border-zinc-800 flex-row items-center space-x-2">
        <TextInput
          className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-xl border border-zinc-700 text-base"
          placeholder="پیام خود را بنویسید..."
          placeholderTextColor="#71717a"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity 
          className="bg-teal-500 px-5 py-3 rounded-xl justify-center items-center ml-2"
          onPress={handleSendMessage}
        >
          <Text className="text-white font-bold">ارسال</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}