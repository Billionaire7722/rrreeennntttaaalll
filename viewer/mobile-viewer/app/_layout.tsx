import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PropertyProvider } from "../contexts/PropertyContext";
import { AuthProvider } from "../contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <AuthProvider>
                    <PropertyProvider>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
                            <Stack.Screen name="register" options={{ presentation: 'modal' }} />
                            <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
                        </Stack>
                    </PropertyProvider>
                </AuthProvider>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}
