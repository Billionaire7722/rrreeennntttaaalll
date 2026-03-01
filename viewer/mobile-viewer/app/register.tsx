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
    StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Mail, Lock, User, Phone, ArrowRight, Home, CheckCircle } from 'lucide-react-native';
import Colors from '@shared/constants/colors';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { signIn } = useAuth();
    const router = useRouter();

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};

        // Name: Letters and spaces only (including Vietnamese characters)
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        if (!name.trim()) {
            newErrors.name = 'Vui lòng nhập họ và tên';
        } else if (!nameRegex.test(name)) {
            newErrors.name = 'Họ và tên không được chứa số hoặc ký tự đặc biệt';
        }

        // Username: Alphanumeric and underscores only
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!username.trim()) {
            newErrors.username = 'Vui lòng nhập tên đăng nhập';
        } else if (!usernameRegex.test(username)) {
            newErrors.username = 'Tên đăng nhập không được chứa ký tự đặc biệt';
        }

        // Phone: Optional, but if provided, must be digits only and 9-11 chars
        const phoneRegex = /^[0-9]{9,11}$/;
        if (phone.trim() && !phoneRegex.test(phone)) {
            newErrors.phone = 'Số điện thoại chỉ bao gồm số (9-11 ký tự)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};

        // Email: Standard email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!emailRegex.test(email)) {
            newErrors.email = 'Định dạng email không hợp lệ';
        }

        // Password: Minimum 6 chars, alphanumeric only (no special chars as requested)
        const passwordRegex = /^[a-zA-Z0-9]{6,}$/;
        if (!password.trim()) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (!passwordRegex.test(password)) {
            newErrors.password = 'Mật khẩu phải từ 6 ký tự, chỉ gồm chữ và số';
        }

        // Confirm Password: Must match password
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleRegister = async () => {
        if (!validateStep2()) return;

        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', {
                name,
                username,
                email,
                phone,
                password,
                confirmPassword
            });
            if (response.data?.user?.role !== 'VIEWER') {
                Alert.alert('ÄÄƒng kÃ½ bá»‹ tá»« chá»‘i', 'ÄÄƒng kÃ½ viewer khÃ´ng thÃ nh cÃ´ng.');
                return;
            }
            await signIn(response.data.access_token, response.data.user);
            router.replace('/(tabs)');
        } catch (error: any) {
            // Handle NestJS validation array messages or general error string
            let errorMsg = 'Không thể hoàn tất đăng ký.';
            if (error.response?.data?.message) {
                const apiMsg = error.response.data.message;
                errorMsg = Array.isArray(apiMsg) ? apiMsg.join('\n') : apiMsg;
            }
            Alert.alert('Đăng ký thất bại', errorMsg);
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
                            <Home size={32} color={Colors.white} />
                        </View>
                    </View>
                    <Text style={styles.brandName}>Rental App</Text>
                    <Text style={styles.welcomeText}>Tạo tài khoản mới 🎉</Text>
                    <Text style={styles.subtitle}>
                        {step === 1 ? 'Bắt đầu với thông tin cơ bản của bạn' : 'Hoàn tất thông tin để sử dụng'}
                    </Text>
                </View>

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
                        <Text style={[styles.progressStepText, step >= 1 && styles.progressStepTextActive]}>1</Text>
                    </View>
                    <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
                    <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
                        <Text style={[styles.progressStepText, step >= 2 && styles.progressStepTextActive]}>2</Text>
                    </View>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    {step === 1 ? (
                        <>
                            {/* Full Name Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Họ và Tên *</Text>
                                <View style={[styles.inputWrapper, errors.name ? styles.inputError : null]}>
                                    <User size={20} color={errors.name ? 'red' : Colors.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="VD: Nguyễn Văn A"
                                        placeholderTextColor="#9ca3af"
                                        value={name}
                                        onChangeText={(text) => { setName(text); setErrors({ ...errors, name: '' }); }}
                                    />
                                </View>
                                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                            </View>

                            {/* Username Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Tên đăng nhập *</Text>
                                <View style={[styles.inputWrapper, errors.username ? styles.inputError : null]}>
                                    <CheckCircle size={20} color={errors.username ? 'red' : Colors.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="VD: nguyenvana123"
                                        placeholderTextColor="#9ca3af"
                                        value={username}
                                        onChangeText={(text) => { setUsername(text); setErrors({ ...errors, username: '' }); }}
                                        autoCapitalize="none"
                                    />
                                </View>
                                {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                            </View>

                            {/* Phone Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Số điện thoại</Text>
                                <View style={[styles.inputWrapper, errors.phone ? styles.inputError : null]}>
                                    <Phone size={20} color={errors.phone ? 'red' : Colors.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="VD: 0912345678"
                                        placeholderTextColor="#9ca3af"
                                        value={phone}
                                        onChangeText={(text) => { setPhone(text); setErrors({ ...errors, phone: '' }); }}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                            </View>

                            {/* Next Button */}
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleNext}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.primaryButtonText}>Tiếp tục</Text>
                                <ArrowRight size={20} color={Colors.white} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email *</Text>
                                <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
                                    <Mail size={20} color={errors.email ? 'red' : Colors.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="VD: nguyenvana@example.com"
                                        placeholderTextColor="#9ca3af"
                                        value={email}
                                        onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: '' }); }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Mật khẩu *</Text>
                                <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
                                    <Lock size={20} color={errors.password ? 'red' : Colors.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Tối thiểu 6 ký tự"
                                        placeholderTextColor="#9ca3af"
                                        value={password}
                                        onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: '' }); }}
                                        secureTextEntry
                                    />
                                </View>
                                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Xác nhận mật khẩu *</Text>
                                <View style={[styles.inputWrapper, errors.confirmPassword ? styles.inputError : null]}>
                                    <Lock size={20} color={errors.confirmPassword ? 'red' : Colors.primary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nhập lại mật khẩu"
                                        placeholderTextColor="#9ca3af"
                                        value={confirmPassword}
                                        onChangeText={(text) => { setConfirmPassword(text); setErrors({ ...errors, confirmPassword: '' }); }}
                                        secureTextEntry
                                    />
                                </View>
                                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                            </View>

                            {/* Register Button */}
                            <TouchableOpacity
                                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                                onPress={handleRegister}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={Colors.white} size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>Đăng Ký</Text>
                                        <ArrowRight size={20} color={Colors.white} />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Back Button */}
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={handleBack}
                                disabled={isLoading}
                            >
                                <Text style={styles.secondaryButtonText}>Quay lại</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Footer Section */}
                <View style={styles.footerSection}>
                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Đã có tài khoản? </Text>
                        <TouchableOpacity onPress={() => router.push('/login')}>
                            <Text style={styles.registerLink}>Đăng nhập</Text>
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
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 24,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 16,
    },
    logoCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    progressStep: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressStepActive: {
        backgroundColor: Colors.primary,
    },
    progressStepText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9ca3af',
    },
    progressStepTextActive: {
        color: Colors.white,
    },
    progressLine: {
        width: 60,
        height: 3,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 8,
    },
    progressLineActive: {
        backgroundColor: Colors.primary,
    },
    formSection: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 18,
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
        height: 54,
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
    primaryButton: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryButtonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    secondaryButtonText: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '600',
    },
    footerSection: {
        marginTop: 'auto',
        paddingTop: 16,
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
