import { View, ImageBackground } from 'react-native';
import LoginCard from '../components/LoginCard';
import styles from '../styles/AppStyles';

export default function LoginScreen({ navigation }) {
  return (
    <ImageBackground
      source={require('../../assets/bg3.png')}
      style={styles.page}
      resizeMode="cover"
    >
      <View style={styles.leftAlignContainer}>
        <LoginCard onLogin={() => navigation.replace('Dashboard')} />
      </View>
    </ImageBackground>
  );
}
