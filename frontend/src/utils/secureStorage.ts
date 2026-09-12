import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

export const saveToken = async (token: string) => {
  if (isWeb) {
    await AsyncStorage.setItem('userToken', token);
  } else {
    await SecureStore.setItemAsync('userToken', token);
  }
};

export const getToken = async (): Promise<string | null> => {
  if (isWeb) {
    return await AsyncStorage.getItem('userToken');
  } else {
    return await SecureStore.getItemAsync('userToken');
  }
};

export const removeToken = async () => {
  if (isWeb) {
    await AsyncStorage.removeItem('userToken');
  } else {
    await SecureStore.deleteItemAsync('userToken');
  }
};