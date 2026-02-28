import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import Colors from '@shared/constants/colors';

export default function MessagesScreen() {
    const { user } = useAuth();
    const router = useRouter();

    if (!user) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-6">
                <Text className="text-xl font-bold text-gray-800 mb-4 text-center">Login Required</Text>
                <Text className="text-gray-500 text-center mb-8">Please login to view and send messages.</Text>
                <TouchableOpacity
                    className="bg-blue-600 px-8 py-3 rounded-lg"
                    onPress={() => router.push('/login')}
                >
                    <Text className="text-white font-bold">Sign In</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <View className="flex-1 items-center justify-center pb-20">
                <MessageCircle size={64} color={Colors.border} />
                <Text className="text-xl font-medium text-gray-800 mt-4 text-center">Messages</Text>
                <Text className="text-gray-500 mt-2 text-center mb-8">
                    Contact the administrator for rental inquiries.
                </Text>
                <TouchableOpacity className="bg-blue-600 px-6 py-3 rounded-lg flex-row items-center">
                    <Text className="text-white font-bold mr-2">New Message</Text>
                    <MessageCircle size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
