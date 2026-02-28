import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Mail, Lock, ArrowRight, Home } from 'lucide-react-native';
import Colors from '@shared/constants/colors';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { signIn } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        const newErrors: Record<string, string> = {};
        if (!loginId.trim()) newErrors.loginId = 'Vui lòng nhập email hoặc tên người dùng';
        if (!password) newErrors.password = 'Vui lòng nhập mật khẩu';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { loginId, password });
            await signIn(response.data.access_token, response.data.user);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Đăng nhập thất bại', error.response?.data?.message || 'Thông tin không hợp lệ');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo & Header Section */}
                <View style={styles.headerSection}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Home size={40} color={Colors.white} />
                        </View>
                    </View>
                    <Text style={styles.brandName}>Rental App</Text>
                    <Text style={styles.welcomeText}>Chào mừng trở lại! 👋</Text>
                    <Text style={styles.subtitle}>Đăng nhập để khám phá không gian sống lý tưởng của bạn</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    {/* Username/Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Tài khoản hoặc Email</Text>
                        <View style={[styles.inputWrapper, errors.loginId ? styles.inputError : null]}>
                            <Mail size={20} color={errors.loginId ? 'red' : Colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập email hoặc tên người dùng"
                                placeholderTextColor="#9ca3af"
                                value={loginId}
                                onChangeText={(text) => { setLoginId(text); setErrors({ ...errors, loginId: '' }); }}
                                autoCapitalize="none"
                            />
                        </View>
                        {errors.loginId && <Text style={styles.errorText}>{errors.loginId}</Text>}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Mật khẩu</Text>
                        <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                            <Lock size={20} color={errors.password ? 'red' : Colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mật khẩu"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: '' }); }}
                                secureTextEntry
                            />
                        </View>
                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity
                        style={styles.forgotPasswordBtn}
                        onPress={() => router.push('/forgot-password')}
                    >
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Đăng Nhập</Text>
                                <ArrowRight size={20} color={Colors.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer Section */}
                <View style={styles.footerSection}>
                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>hoặc</Text>
                        <View style={styles.divider} />
                    </View>

                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={() => router.push('/register')}>
                            <Text style={styles.registerLink}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 24,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    formSection: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        paddingHorizontal: 16,
        height: 56,
    },
    inputError: {
        borderColor: 'red',
        backgroundColor: '#fffcfc',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1f2937',
        height: '100%',
    },
    forgotPasswordBtn: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    loginButton: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    footerSection: {
        marginTop: 'auto',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        fontSize: 14,
        color: '#9ca3af',
        marginHorizontal: 16,
        fontWeight: '500',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        fontSize: 15,
        color: '#6b7280',
    },
    registerLink: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
});
