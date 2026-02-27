import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LayoutDashboard, ScanBarcode, UserCircle, Settings2 } from 'lucide-react-native';

// Defer loading screens to speed up initial app boot and reduce blank screen time
const LoginScreen = (props) => {
    const Screen = require('../screens/LoginScreen').default;
    return <Screen {...props} />;
};
const DashboardScreen = (props) => {
    const Screen = require('../screens/DashboardScreen').default;
    return <Screen {...props} />;
};
const ScanScreen = (props) => {
    const Screen = require('../screens/ScanScreen').default;
    return <Screen {...props} />;
};
const ProfileScreen = (props) => {
    const Screen = require('../screens/ProfileScreen').default;
    return <Screen {...props} />;
};
const ManagementScreen = (props) => {
    const Screen = require('../screens/ManagementScreen').default;
    return <Screen {...props} />;
};
import SplashScreen from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = ({ route }) => {
    const { user } = route.params || {};
    const isAdmin = user?.role === 'admin';
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: true,
                headerStyle: {
                    backgroundColor: '#fff',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                },
                headerTitleStyle: {
                    fontWeight: '800',
                    color: '#1e293b',
                },
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Dashboard') {
                        return <LayoutDashboard size={size} color={color} />;
                    } else if (route.name === 'Scan') {
                        return <ScanBarcode size={size} color={color} />;
                    } else if (route.name === 'Management') {
                        return <Settings2 size={size} color={color} />;
                    } else if (route.name === 'Profile') {
                        return <UserCircle size={size} color={color} />;
                    }
                },
                tabBarActiveTintColor: '#165DFF',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    height: 75 + (insets.bottom > 0 ? insets.bottom / 2 : 0),
                    paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 15,
                    paddingTop: 12,
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Tab.Screen name="Scan" component={ScanScreen} options={{ headerShown: false }} />
            {isAdmin && (
                <Tab.Screen name="Management" component={ManagementScreen} options={{ title: 'Manajemen' }} />
            )}
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil Saya' }} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState('Login');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userData = await AsyncStorage.getItem('user');
                if (token && userData) {
                    setUser(JSON.parse(userData));
                    setInitialRoute('Main');
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkAuth();
    }, []);

    if (isLoading) {
        return <SplashScreen onFinish={() => setIsLoading(false)} />;
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName={initialRoute}
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Main" component={MainTabs} initialParams={{ user }} />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default AppNavigator;
