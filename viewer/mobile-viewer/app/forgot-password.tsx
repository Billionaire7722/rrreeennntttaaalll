import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleReset = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setError('Vui lòng nhập địa chỉ email của bạn');
            return;
        } else if (!emailRegex.test(email)) {
            setError('Định dạng email không hợp lệ');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setIsSent(true);
            Alert.alert('Thành công', 'Một liên kết đặt lại mật khẩu đã được gửi đến email của bạn.');
        } catch (error: any) {
            Alert.alert('Thất bại', error.response?.data?.message || 'Không tìm thấy email hoặc lỗi máy chủ.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}>

                <TouchableOpacity className="absolute top-12 left-6 p-2" onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>

                <View className="mb-10 mt-16">
                    <Text className="text-3xl font-extrabold text-[#1f2937] mb-3 tracking-tight">Khôi phục mật khẩu</Text>
                    {!isSent && (
                        <Text className="text-base text-gray-500 leading-6">
                            Đừng lo lắng! Vui lòng nhập email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
                        </Text>
                    )}
                </View>

                {!isSent ? (
                    <>
                        <View className="mb-8">
                            <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Địa chỉ Email</Text>
                            <View className={`flex-row items-center w-full rounded-2xl px-4 py-3 border focus:border-blue-500 ${error ? 'bg-[#fffcfc] border-red-500' : 'bg-[#f3f4f6] border-transparent'}`}>
                                <Mail size={20} color={error ? 'red' : '#9ca3af'} />
                                <TextInput
                                    className="flex-1 ml-3 text-base text-gray-800"
                                    placeholder="VD: email@example.com"
                                    placeholderTextColor="#9ca3af"
                                    value={email}
                                    onChangeText={(text) => { setEmail(text); setError(''); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}}
                                />
                            </View>
                            {error ? <Text className="text-red-500 text-xs mt-2 ml-1">{error}</Text> : null}
                        </View>

                        <TouchableOpacity
                            className={`w-full bg-[#2563eb] rounded-2xl py-4 items-center mb-4 flex-row justify-center shadow-lg shadow-blue-500/30 ${isLoading ? 'opacity-70' : ''}`}
                            onPress={handleReset}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-lg mr-2">Gửi Liên Kết</Text>
                                    <Send size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <View className="items-center mb-8 bg-[#f0fdf4] p-6 rounded-2xl border border-green-100">
                        <Text className="text-green-700 text-lg text-center font-semibold mb-6 leading-7">
                            Hãy kiểm tra hộp thư đến của bạn để nhận liên kết khôi phục!
                        </Text>
                        <TouchableOpacity
                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 items-center shadow-sm"
                            onPress={() => router.replace('/login')}
                            activeOpacity={0.8}
                        >
                            <Text className="text-gray-800 font-bold text-lg">Quay lại Đăng Nhập</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
