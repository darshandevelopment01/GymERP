// frontend/src/screens/LoginScreen.js
import { View, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import LoginCard from '../components/LoginCard';
import { useState, useEffect } from 'react';

export default function LoginScreen({ navigation }) {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const handleLogin = (user) => {
    navigation.replace('Dashboard', { user });
  };

  const { width } = dimensions;
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  return (
    <View style={screenStyles.container}>
      <View style={screenStyles.backgroundWrapper}>
        <ImageBackground
          source={require('../../assets/bg2.png')}
          style={screenStyles.fullScreen}
          resizeMode={isSmallScreen ? 'cover' : 'stretch'}
          imageStyle={isSmallScreen ? {
            // On mobile: shift left by -100% to show the RIGHT side (person)
            width: '200%',
            left: '-100%',  // Negative = shift left to reveal right portion
          } : undefined}
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
    </View>
  );
}

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundWrapper: {
    flex: 1,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingLeft: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  leftAlign: {
    width: 380,
  },
  centerAlign: {
    width: '100%',
    maxWidth: 400,
  },
  mediumAlign: {
    width: 380,
  },
  largeAlign: {
    width: 420,
  },
});
