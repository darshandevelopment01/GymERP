// frontend/src/components/LoginCard.js
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';

export default function LoginCard({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Update dimensions on resize
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

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
  const isSmallScreen = dimensions.width < 768;
  const isMediumScreen = dimensions.width >= 768 && dimensions.width < 1024;

  return (
    <View style={[
      cardStyles.loginCard,
      isSmallScreen && cardStyles.loginCardMobile,
      isMediumScreen && cardStyles.loginCardMedium
    ]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[
          cardStyles.logo,
          isSmallScreen && cardStyles.logoMobile,
          isMediumScreen && cardStyles.logoMedium
        ]}
        resizeMode="contain"
      />

      <View style={[
        cardStyles.inputGroup,
        isSmallScreen && cardStyles.inputGroupMobile
      ]}>
        <Text style={[
          cardStyles.label,
          isSmallScreen && cardStyles.labelMobile
        ]}>Email Address</Text>
        <TextInput
          style={[
            cardStyles.input,
            isSmallScreen && cardStyles.inputMobile
          ]}
          placeholder="Enter your email"
          placeholderTextColor="rgba(0, 0, 0, 0.4)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={[
        cardStyles.inputGroup,
        isSmallScreen && cardStyles.inputGroupMobile
      ]}>
        <Text style={[
          cardStyles.label,
          isSmallScreen && cardStyles.labelMobile
        ]}>Password</Text>
        <TextInput
          style={[
            cardStyles.input,
            isSmallScreen && cardStyles.inputMobile
          ]}
          placeholder="Enter your password"
          placeholderTextColor="rgba(0, 0, 0, 0.4)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={[
          cardStyles.signInButton,
          isSmallScreen && cardStyles.signInButtonMobile
        ]} 
        onPress={handleSignIn}
      >
        <Text style={[
          cardStyles.signInText,
          isSmallScreen && cardStyles.signInTextMobile
        ]}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  // Desktop styles (default)
  loginCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  loginCardMobile: {
    padding: 24,
    borderRadius: 12,
  },
  loginCardMedium: {
    padding: 32,
    borderRadius: 14,
  },
  
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginTop: -20,
    marginBottom: -15,
  },
  logoMobile: {
    width: 120,
    height: 120,
    marginTop: -10,
    marginBottom: -10,
  },
  logoMedium: {
    width: 160,
    height: 160,
    marginTop: -15,
    marginBottom: -12,
  },
  
  inputGroup: {
    marginBottom: 22,
  },
  inputGroupMobile: {
    marginBottom: 16,
  },
  
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  labelMobile: {
    fontSize: 13,
    marginBottom: 8,
  },
  
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 10,
    paddingHorizontal: 18,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  inputMobile: {
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  
  signInButton: {
    marginTop: 12,
    height: 54,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonMobile: {
    height: 46,
    borderRadius: 8,
    marginTop: 8,
  },
  
  signInText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInTextMobile: {
    fontSize: 15,
    fontWeight: '600',
  },
});
