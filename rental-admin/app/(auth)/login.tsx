import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../constants/api';

export default function LoginScreen() {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!loginId.trim() || !password) {
            Alert.alert('Error', 'Please enter login ID and password.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId: loginId.trim(), password }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || 'Login failed');
            }

            const role = data?.user?.role;
            if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
                throw new Error('This account is not allowed in rental-admin.');
            }

            await login(data.access_token, data.user);
            router.replace('/(tabs)/(map)');
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Login failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>Welcome to</Text>
                    <Text style={styles.brandTitle}>rental-admin</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Log in as Admin/Super Admin</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Username or email"
                        value={loginId}
                        onChangeText={setLoginId}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        returnKeyType="go"
                        onSubmitEditing={handleLogin}
                    />
                    <Pressable
                        style={[styles.button, (!loginId.trim() || !password || submitting) && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={!loginId.trim() || !password || submitting}
                    >
                        <Text style={styles.buttonText}>{submitting ? 'Signing in...' : 'Continue'}</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 24,
        color: Colors.light.textSecondary,
        marginBottom: 8,
    },
    brandTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.primary,
    },
    formContainer: {
        width: '100%',
    },
    label: {
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 12,
        fontWeight: '500',
    },
    input: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 24,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
