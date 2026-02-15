import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../utils/constants';

import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import DocumentPreviewScreen from '../screens/DocumentPreviewScreen';
import SignatureScreen from '../screens/SignatureScreen';
import SignatureCaptureScreen from '../screens/SignatureCaptureScreen';
import SignatureTypedScreen from '../screens/SignatureTypedScreen';
import SignatureManagerScreen from '../screens/SignatureManagerScreen';
import PlaceSignatureScreen from '../screens/PlaceSignatureScreen';
import FinalPreviewScreen from '../screens/FinalPreviewScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import PaywallScreen from '../screens/PaywallScreen';
import CustomerCenterScreen from '../screens/CustomerCenterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: 'Scan Document',
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="DocumentPreview"
          component={DocumentPreviewScreen}
          options={{ title: 'Document Preview' }}
        />
        <Stack.Screen
          name="Signature"
          component={SignatureScreen}
          options={{
            title: 'Signature',
            presentation: 'card',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SignatureCapture"
          component={SignatureCaptureScreen}
          options={{
            title: 'Capture Signature',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="SignatureTyped"
          component={SignatureTypedScreen}
          options={{
            title: 'Type Signature',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="SignatureManager"
          component={SignatureManagerScreen}
          options={{ title: 'My Signatures' }}
        />
        <Stack.Screen
          name="PlaceSignature"
          component={PlaceSignatureScreen}
          options={{ title: 'Place Signature' }}
        />
        <Stack.Screen
          name="FinalPreview"
          component={FinalPreviewScreen}
          options={{ title: 'Signed Document' }}
        />
        <Stack.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{ title: 'My Documents' }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            title: 'Premium',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="CustomerCenter"
          component={CustomerCenterScreen}
          options={{
            title: 'Subscription',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
