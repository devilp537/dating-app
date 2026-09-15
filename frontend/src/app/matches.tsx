import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Clipboard, Modal } from 'react-native';
import { router } from 'expo-router';
import { apiClient } from '../api/client';
import { getToken } from '../utils/secureStorage';
import { Feather } from '@expo/vector-icons';

const COLORS = { 
  bg: '#000000', 
  surface: '#111018', 
  surfaceAlt: '#181622', 
  border: 'rgba(167,139,250,0.18)', 
  accent: '#8B5CF6', 
  accentSoft: '#A78BFA', 
  text: '#F5F3FF', 
  textMuted: '#8B879A',
  danger: '#EF4444', // قرمز برای ریپورت
  warning: '#F59E0B' // نارنجی برای بلاک
};

const EMOJIS = ['👽', '👻', '🤖', '👾', '🤡', '😎', '🤓', '🦊'];

const REPORT_REASONS = [
  'محتوای نامناسب',
  'اسپم (Spam)',
  'تشابه کارت‌ها (پروفایل فیک)'
];

export default function MatchesScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // استیت‌های مودال سه نقطه
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return router.replace('/');
      
      const res = await apiClient.get('/matches');
      setMatches(res.data);
    } catch {
      // خطا هندل می‌شود
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const copy = (t: string, type: string) => { 
    Clipboard.setString(t); 
    Alert.alert('کپی شد', `${type} در کلیپ‌بورد ذخیره شد.`); 
  };

  // تابع لغو مچ و مسدودسازی (Block)
  const handleBlock = async () => {
    if (!selectedMatch) return;
    
    try {
      await apiClient.post('/users/block', { 
        targetUserId: selectedMatch.user.id 
      });
      
      setMatches((prev) => prev.filter(m => m.id !== selectedMatch.id));
      setReportModalVisible(false);
      setSelectedMatch(null);
      
      Alert.alert('لغو مچ', 'این شخص مسدود شد و ارتباط شما قطع گردید.');
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در مسدودسازی پیش آمد.');
    }
  };

  // تابع گزارش دادن (Report)
  const handleReport = async (reason: string) => {
    if (!selectedMatch) return;
    
    try {
      await apiClient.post('/users/report', { 
        targetUserId: selectedMatch.user.id, 
        reason 
      });
      
      setMatches((prev) => prev.filter(m => m.id !== selectedMatch.id));
      setReportModalVisible(false);
      setSelectedMatch(null);
      
      Alert.alert('گزارش ثبت شد', 'گزارش شما ثبت شد و این مچ برای همیشه لغو گردید.');
    } catch (error) {
      Alert.alert('خطا', 'مشکلی در ثبت گزارش پیش آمد.');
    }
  };

  const openActionMenu = (matchItem: any) => {
    setSelectedMatch(matchItem);
    setReportModalVisible(true);
  };

  return (
    <View className="flex-1 px-5 pt-12 pb-8" style={{ backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold tracking-wider" style={{ color: COLORS.text }}>MATCHES</Text>
        <View className="flex-row gap-3">
          <TouchableOpacity onPress={fetchMatches} className="p-2.5 rounded-2xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <Feather name="refresh-cw" size={18} color={COLORS.accentSoft} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/home')} className="p-2.5 rounded-2xl border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <Feather name="chevron-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={COLORS.accentSoft} size="large" />
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Feather name="users" size={44} color={COLORS.textMuted} className="mb-4" />
              <Text style={{ color: COLORS.textMuted }} className="mb-6 text-base font-medium">مچی یافت نشد</Text>
              <TouchableOpacity className="px-5 py-2.5 rounded-xl flex-row items-center gap-2 border" style={{ backgroundColor: COLORS.surfaceAlt, borderColor: COLORS.border }} onPress={fetchMatches}>
                <Feather name="refresh-cw" size={15} color={COLORS.accentSoft} />
                <Text style={{ color: COLORS.accentSoft }} className="font-bold text-sm">تلاش مجدد</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const targetUser = item.user;
            const hasPhone = !!targetUser?.phoneNumber;
            const hasContactId = !!targetUser?.contactId;

            return (
              <View className="p-5 rounded-[24px] mb-4 border" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                <View className="flex-row items-center mb-5 justify-between">
                  
                  <View className="flex-row items-center flex-1">
                    <View className="w-14 h-14 rounded-full items-center justify-center mr-4" style={{ backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border }}>
                      <Text className="text-2xl">{EMOJIS[(targetUser?.id?.charCodeAt(0) || 0) % EMOJIS.length]}</Text>
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>{targetUser?.name || 'کاربر ناشناس'}</Text>
                      <Text className="text-sm" style={{ color: COLORS.textMuted }} numberOfLines={1}>{targetUser?.bio || 'بدون بیوگرافی'}</Text>
                    </View>
                  </View>

                  {/* دکمه سه نقطه برای اکشن‌ها */}
                  <TouchableOpacity className="p-2" onPress={() => openActionMenu(item)}>
                    <Feather name="more-vertical" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>

                </View>

                <View className="flex-row gap-3">
                  {hasContactId ? (
                    <TouchableOpacity 
                      className="flex-1 h-11 rounded-xl flex-row items-center justify-center gap-2 border" 
                      style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: COLORS.border }} 
                      onPress={() => copy(targetUser.contactId, 'آیدی')}
                    >
                      <Feather name="at-sign" size={15} color={COLORS.accentSoft} />
                      <Text style={{ color: COLORS.accentSoft }} className="font-bold text-sm">{targetUser.contactId}</Text>
                    </TouchableOpacity>
                  ) : null}
                  
                  <TouchableOpacity 
                    className="flex-1 h-11 rounded-xl flex-row items-center justify-center gap-2 border" 
                    style={{ backgroundColor: hasPhone ? COLORS.surfaceAlt : 'transparent', borderColor: COLORS.border }} 
                    onPress={() => hasPhone && copy(targetUser.phoneNumber, 'شماره')}
                  >
                    <Feather name={hasPhone ? "phone" : "phone-off"} size={15} color={hasPhone ? COLORS.text : COLORS.textMuted} />
                    <Text style={{ color: hasPhone ? COLORS.text : COLORS.textMuted }} className="font-bold text-sm">
                      {hasPhone ? targetUser.phoneNumber : 'مخفی'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* مودال انتخاب بلاک یا گزارش */}
      <Modal visible={reportModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View className="rounded-t-[32px] pt-4 pb-10 px-2" style={{ backgroundColor: COLORS.surface }}>
            <View className="flex-row justify-between items-center px-6 mb-4 mt-2">
              <Text className="text-lg font-bold" style={{ color: COLORS.text }}>مدیریت مچ</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} className="p-2">
                <Feather name="x" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text className="px-6 mb-6 text-sm leading-6" style={{ color: COLORS.textMuted }}>
              شما می‌توانید بدون ثبت گزارش، مچ را لغو کنید تا کاربر دیگر به شما نشان داده نشود؛ و یا در صورت تخلف، او را گزارش دهید.
            </Text>

            {/* 👈 دکمه فقط بلاک / لغو مچ */}
            <TouchableOpacity 
              className="px-6 py-4 border-b flex-row items-center justify-between" 
              style={{ borderBottomColor: COLORS.border }}
              onPress={handleBlock}
            >
              <Text className="text-base font-bold" style={{ color: COLORS.warning }}>🚫 لغو مچ و مسدود کردن (بدون گزارش)</Text>
            </TouchableOpacity>

            {/* 👈 دکمه‌های گزارش دادن */}
            {REPORT_REASONS.map((reason, index) => (
              <TouchableOpacity 
                key={index}
                className="px-6 py-4 border-b flex-row items-center justify-between" 
                style={{ borderBottomColor: COLORS.border }}
                onPress={() => handleReport(reason)}
              >
                <Text className="text-base font-medium" style={{ color: COLORS.text }}>🚩 گزارش: {reason}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              className="px-6 py-4 items-center justify-center mt-4" 
              onPress={() => setReportModalVisible(false)}
            >
              <Text className="text-base font-bold" style={{ color: COLORS.textMuted }}>انصراف</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}