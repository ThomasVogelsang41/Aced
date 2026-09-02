import React from 'react';
import { View } from 'react-native';

export interface RealisticDiscArtworkProps {
  name: string;
  brand: string;
  color: string;
  textColor?: string;
  size?: number;
}

export const RealisticDiscArtwork: React.FC<RealisticDiscArtworkProps> = ({
  name,
  brand,
  color,
  textColor = '#FFFFFF',
  size = 64,
}) => {
  const innerSize = size * 0.72;
  const stampSize = size * 0.46;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: size > 50 ? 3.5 : 2,
        borderColor: 'rgba(255, 255, 255, 0.45)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Outer Rim Sheen Overlay */}
      <View
        style={{
          position: 'absolute',
          top: -2,
          left: 4,
          right: 4,
          height: size * 0.35,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          transform: [{ rotate: '-35deg' }],
        }}
      />
      {/* Inner Flight Plate Ring Contour */}
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Hot Stamp Foil Center Ring */}
        <View
          style={{
            width: stampSize,
            height: stampSize,
            borderRadius: stampSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          <View
            style={{
              width: stampSize * 0.45,
              height: stampSize * 0.45,
              borderRadius: (stampSize * 0.45) / 2,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
          />
        </View>
      </View>
    </View>
  );
};
