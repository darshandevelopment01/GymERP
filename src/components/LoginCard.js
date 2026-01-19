// frontend/src/components/LoginCard.js
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useState } from 'react';

const { width } = Dimensions.get('window');

export default function LoginCard({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    if (email && password) {
      const user = {
        name: 'Admin User',
        email: email,
        role: 'Administrator',
      };
      onLogin(user);
    }
  };

  // Responsive sizing
  const isSmallScreen = width < 768;

  return (
    <View style={[
      cardStyles.loginCard,
      isSmallScreen && cardStyles.loginCardMobile
    ]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[
          cardStyles.logo,
          isSmallScreen && cardStyles.logoMobile
        ]}
        resizeMode="contain"
      />

      <View style={cardStyles.inputGroup}>
        <Text style={cardStyles.label}>Email Address</Text>
        <TextInput
          style={cardStyles.input}
          placeholder="Enter your email"
          placeholderTextColor="rgba(0, 0, 0, 0.4)" // Changed to dark gray
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={cardStyles.inputGroup}>
        <Text style={cardStyles.label}>Password</Text>
        <TextInput
          style={cardStyles.input}
          placeholder="Enter your password"
          placeholderTextColor="rgba(0, 0, 0, 0.4)" // Changed to dark gray
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={cardStyles.signInButton} onPress={handleSignIn}>
        <Text style={cardStyles.signInText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  loginCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  loginCardMobile: {
    padding: 30,
    borderRadius: 12,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: -20,
    marginBottom: -15,
  },
  logoMobile: {
    width: 150,
    height: 150,
    marginTop: -10,
    marginBottom: -10,
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)', // Lighter border
    borderRadius: 10,
    paddingHorizontal: 18,
    fontSize: 16,
    backgroundColor: '#FFFFFF', // Changed to white
    color: '#000000', // Changed text to black
  },
  signInButton: {
    marginTop: 12,
    height: 54,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
