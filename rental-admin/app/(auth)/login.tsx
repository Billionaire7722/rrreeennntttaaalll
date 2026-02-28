import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (username.trim().length > 0) {
            let isAdmin = false;
            if (username.trim() === 'davik') {
                if (password !== '070720021234567890qwertyuiopASDFGHJKL') {
                    Alert.alert('Error', 'Invalid password for admin user.');
                    return;
                }
                isAdmin = true;
            }
            await login(username.trim(), isAdmin);
            router.replace('/(tabs)/(map)');
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
                    <Text style={styles.brandTitle}>rental by davikk</Text>
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Log in to continue</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
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
                        style={[styles.button, !username.trim() && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={!username.trim()}
                    >
                        <Text style={styles.buttonText}>Continue</Text>
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
