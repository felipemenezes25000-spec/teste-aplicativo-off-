import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../utils/constants';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { image: 60, fontSize: SIZES.fontLg },
    md: { image: 80, fontSize: SIZES.fontXl },
    lg: { image: 100, fontSize: SIZES.font2xl },
    xl: { image: 140, fontSize: SIZES.font3xl },
  };

  const currentSize = sizes[size];

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/logo-renoveja.jpeg')}
        style={{ 
          width: currentSize.image, 
          height: currentSize.image,
          borderRadius: SIZES.radiusLg,
        }}
        resizeMode="contain"
      />
      {showText && (
        <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>
          RenoveJá<Text style={styles.plus}>+</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SIZES.sm,
  },
  plus: {
    color: COLORS.healthOrange,
  },
});
