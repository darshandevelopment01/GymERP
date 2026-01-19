// frontend/src/screens/LoginScreen.js
import { View, ImageBackground, StyleSheet, Dimensions, Platform } from 'react-native';
import LoginCard from '../components/LoginCard';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const handleLogin = (user) => {
    navigation.replace('Dashboard', { user });
  };

  // Responsive sizing
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  return (
    <View style={screenStyles.container}>
      <ImageBackground
        source={require('../../assets/bg2.png')}
        style={screenStyles.fullScreen}
        resizeMode="stretch"
      >
        <View style={[
          screenStyles.overlay,
          isSmallScreen && screenStyles.overlayMobile
        ]}>
          <View style={[
            screenStyles.leftAlign,
            isSmallScreen && screenStyles.centerAlign,
            isMediumScreen && screenStyles.mediumAlign,
            isLargeScreen && screenStyles.largeAlign
          ]}>
            <LoginCard onLogin={handleLogin} />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 60,
  },
  overlayMobile: {
    paddingLeft: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  leftAlign: {
    width: 380, // Increased from 300
  },
  centerAlign: {
    width: '100%',
    maxWidth: 400,
  },
  mediumAlign: {
    width: 380,
  },
  largeAlign: {
    width: 420, // Even bigger for large screens
  },
});
