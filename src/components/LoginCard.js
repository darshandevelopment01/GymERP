import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import styles from '../styles/AppStyles';

export default function LoginCard({ onLogin }) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  return (
    <View
      style={[
        styles.loginCard,
        { width: isSmallScreen ? '90%' : 420 },
      ]}
    >
      {/* Logo */}
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
      />

      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
        />
      </View>

      {/* Button */}
      <Pressable
        onPress={onLogin}
        style={({ hovered, pressed }) => [
          styles.signInButton,
          hovered && styles.signInButtonHover,
          pressed && styles.signInButtonPressed,
        ]}
      >
        <Text style={styles.signInText}>Sign In</Text>
      </Pressable>
    </View>
  );
}
