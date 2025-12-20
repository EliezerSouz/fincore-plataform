import { View, Text, Alert } from "react-native";
import { Link } from "expo-router";
import { Button } from "@financeiro/ui";
import { accountService } from "@financeiro/core";
import { useState } from "react";

export default function HomeScreen() {
    const [status, setStatus] = useState("Idle");

    const testConnection = async () => {
        try {
            setStatus("Fetching...");
            const accounts = await accountService.list();
            Alert.alert("Success", `Found ${accounts.length} accounts`);
            setStatus("Success");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unknown error");
            setStatus("Error: " + error.message);
        }
    };

    return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-black p-4 gap-4">
            <Text className="text-2xl font-bold dark:text-white">Financeiro Mobile</Text>
            <Text className="text-gray-500">Core Interaction Test</Text>
            <Text className={status.startsWith("Error") ? "text-red-500" : "text-green-600"}>{status}</Text>

            <Button
                onPress={testConnection}
                label="Test Core Connection (List Accounts)"
            />

            <Button variant="destructive" label="Destructive Variant" />

            <Link href="/details" className="text-blue-500 mt-4">
                Go to Details (if exists)
            </Link>
        </View>
    );
}
