import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Colors from '@shared/constants/colors';

export default function EntryPoint() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.replace('/(tabs)');
            } else {
                router.replace('/login');
            }
        }
    }, [user, loading, router]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );
}
