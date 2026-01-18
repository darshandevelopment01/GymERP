import { View, Text, Platform, useWindowDimensions, TextInput, Pressable, Image ,ImageBackground,} from 'react-native';
import styles from './src/styles/AppStyles';

export default function App() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isSmallScreen = width < 768;

  return (
    <ImageBackground
  source={require('./assets/muscle_time_background.jpeg')}
  
  style={styles.page}
  resizeMode="cover"
>
      <View style={styles.outerCenter}>
      <View
        style={[
          styles.centerBox,
          { flexDirection: isWeb && !isSmallScreen ? 'row' : 'column' },
        ]}
      >
        {/* Left Side */}
  {/* <View style={styles.left}>
    
    
      <Image
          source={require('./assets/muscle_time.jpeg')} // 👈 your image path
          style={styles.leftImage}
          resizeMode="contain"
        />
        
    
  </View>
 */}



       {/* Right Side */}
<View style={styles.right}>
  <Text style={styles.welcome}>Welcome Back</Text>
  <Text style={styles.subText}>
    Sign in to access your dashboard
  </Text>

  {/* Email Field */}
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
  {/* Password Field */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Password</Text>
  <TextInput
    style={styles.input}
    placeholder="Enter your password"
    placeholderTextColor="#9CA3AF"
    secureTextEntry
  />
</View>
{/* ✅ Sign In Button (correct place) */}
  <Pressable
  onPress={() => console.log('Sign In clicked')}
  style={({ hovered, pressed }) => [
    styles.signInButton,
    hovered && styles.signInButtonHover,   // 🌐 web hover
    pressed && styles.signInButtonPressed, // 📱 press feedback
  ]}
>
  <Text style={styles.signInText}>Sign In</Text>
</Pressable>

</View>


      </View>
    </View>
</ImageBackground>
  );
}

