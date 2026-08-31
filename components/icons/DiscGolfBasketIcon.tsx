import React from 'react';
import { Image } from 'react-native';

export interface DiscGolfBasketIconProps {
  size?: number;
}

export const DiscGolfBasketIcon: React.FC<DiscGolfBasketIconProps> = ({
  size = 32,
}) => {
  return (
    <Image
      source={require('../../assets/images/disc_golf_basket_pin.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};
