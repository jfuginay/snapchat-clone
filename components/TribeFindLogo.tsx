import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';

interface TribeFindLogoProps {
  size?: number;
  style?: ViewStyle;
  showAnimation?: boolean;
}

export const TribeFindLogo: React.FC<TribeFindLogoProps> = ({ 
  size = 80, 
  style,
  showAnimation = false 
}) => {
  // Check if we're in Expo Go - if so, use a fallback
  let Svg: any = null;
  let Circle: any = null;
  let Path: any = null;
  let G: any = null;
  let Defs: any = null;
  let LinearGradient: any = null;
  let RadialGradient: any = null;
  let Stop: any = null;

  try {
    const svgModule = require('react-native-svg');
    Svg = svgModule.default || svgModule.Svg;
    Circle = svgModule.Circle;
    Path = svgModule.Path;
    G = svgModule.G;
    Defs = svgModule.Defs;
    LinearGradient = svgModule.LinearGradient;
    RadialGradient = svgModule.RadialGradient;
    Stop = svgModule.Stop;
  } catch (error) {
    // react-native-svg not available (Expo Go), use fallback
    console.log('🎯 Using TribeFIND logo fallback for Expo Go');
  }

  // Fallback component for Expo Go
  if (!Svg) {
    return (
      <View style={[styles.fallbackContainer, style, { width: size, height: size }]}>
        <View style={[styles.fallbackLogo, { width: size * 0.8, height: size * 0.8 }]}>
          <Text style={[styles.fallbackText, { fontSize: size * 0.25 }]}>🧭</Text>
          <Text style={[styles.fallbackSubtext, { fontSize: size * 0.1 }]}>TF</Text>
        </View>
      </View>
    );
  }

  // Full SVG version for production builds
  return (
    <View style={[styles.container, style]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Outer compass ring */}
        <Circle 
          cx="100" 
          cy="100" 
          r="85" 
          fill="none" 
          stroke="url(#ringGradient)" 
          strokeWidth="2" 
          opacity="0.4"
        />
        <Circle 
          cx="100" 
          cy="100" 
          r="70" 
          fill="none" 
          stroke="url(#ringGradient)" 
          strokeWidth="1" 
          opacity="0.3"
        />
        
        {/* Main compass points */}
        <G transform="translate(100, 100)">
          {/* North */}
          <G transform="rotate(0)">
            <Path d="M0,-75 L0,-60" stroke="url(#compassGradient)" strokeWidth="3"/>
            <Circle cx="0" cy="-75" r="6" fill="url(#hubGradient)"/>
            <Circle cx="-12" cy="-68" r="3" fill="#6366f1"/>
            <Circle cx="12" cy="-68" r="3" fill="#8b5cf6"/>
            <Circle cx="0" cy="-55" r="2" fill="#a78bfa"/>
            <Path d="M0,-75 L-12,-68" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.4"/>
            <Path d="M0,-75 L12,-68" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.4"/>
          </G>
          
          {/* East */}
          <G transform="rotate(90)">
            <Path d="M0,-75 L0,-60" stroke="url(#compassGradient)" strokeWidth="3"/>
            <Circle cx="0" cy="-75" r="6" fill="url(#hubGradient)"/>
            <Circle cx="-10" cy="-65" r="3" fill="#4a7c59"/>
            <Circle cx="10" cy="-65" r="3" fill="#6366f1"/>
            <Circle cx="0" cy="-58" r="2" fill="#8b5cf6"/>
          </G>
          
          {/* South */}
          <G transform="rotate(180)">
            <Path d="M0,-75 L0,-60" stroke="url(#compassGradient)" strokeWidth="3"/>
            <Circle cx="0" cy="-75" r="6" fill="url(#hubGradient)"/>
            <Circle cx="-12" cy="-68" r="3" fill="#8b5cf6"/>
            <Circle cx="12" cy="-68" r="3" fill="#4a7c59"/>
            <Circle cx="0" cy="-55" r="2" fill="#6366f1"/>
          </G>
          
          {/* West */}
          <G transform="rotate(270)">
            <Path d="M0,-75 L0,-60" stroke="url(#compassGradient)" strokeWidth="3"/>
            <Circle cx="0" cy="-75" r="6" fill="url(#hubGradient)"/>
            <Circle cx="-10" cy="-65" r="3" fill="#a78bfa"/>
            <Circle cx="10" cy="-65" r="3" fill="#8b5cf6"/>
            <Circle cx="0" cy="-58" r="2" fill="#4a7c59"/>
          </G>
          
          {/* Secondary compass points */}
          <G transform="rotate(45)">
            <Path d="M0,-55 L0,-45" stroke="url(#compassGradient)" strokeWidth="2" opacity="0.7"/>
            <Circle cx="0" cy="-55" r="4" fill="#6366f1"/>
            <Circle cx="-8" cy="-48" r="2" fill="#8b5cf6"/>
            <Circle cx="8" cy="-48" r="2" fill="#a78bfa"/>
          </G>
          
          <G transform="rotate(135)">
            <Path d="M0,-55 L0,-45" stroke="url(#compassGradient)" strokeWidth="2" opacity="0.7"/>
            <Circle cx="0" cy="-55" r="4" fill="#8b5cf6"/>
            <Circle cx="-8" cy="-48" r="2" fill="#4a7c59"/>
            <Circle cx="8" cy="-48" r="2" fill="#6366f1"/>
          </G>
          
          <G transform="rotate(225)">
            <Path d="M0,-55 L0,-45" stroke="url(#compassGradient)" strokeWidth="2" opacity="0.7"/>
            <Circle cx="0" cy="-55" r="4" fill="#4a7c59"/>
            <Circle cx="-8" cy="-48" r="2" fill="#a78bfa"/>
            <Circle cx="8" cy="-48" r="2" fill="#8b5cf6"/>
          </G>
          
          <G transform="rotate(315)">
            <Path d="M0,-55 L0,-45" stroke="url(#compassGradient)" strokeWidth="2" opacity="0.7"/>
            <Circle cx="0" cy="-55" r="4" fill="#a78bfa"/>
            <Circle cx="-8" cy="-48" r="2" fill="#6366f1"/>
            <Circle cx="8" cy="-48" r="2" fill="#4a7c59"/>
          </G>
        </G>
        
        {/* Central AI hub */}
        <Circle cx="100" cy="100" r="12" fill="url(#centerGradient)"/>
        <Circle cx="100" cy="100" r="6" fill="url(#innerGradient)" opacity="0.8"/>
        <Circle cx="100" cy="100" r="2" fill="#e8f4f0"/>
        
        {/* Inner discovery gems */}
        <Circle cx="85" cy="100" r="2" fill="#6366f1"/>
        <Circle cx="115" cy="100" r="2" fill="#8b5cf6"/>
        <Circle cx="100" cy="85" r="2" fill="#4a7c59"/>
        <Circle cx="100" cy="115" r="2" fill="#a78bfa"/>
        
        {/* Radial connection lines from center */}
        <Path d="M100,100 L100,25" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.2"/>
        <Path d="M100,100 L175,100" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.2"/>
        <Path d="M100,100 L100,175" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.2"/>
        <Path d="M100,100 L25,100" stroke="url(#connectionGradient)" strokeWidth="1" opacity="0.2"/>
        
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2d5f3f" stopOpacity="1" />
            <Stop offset="50%" stopColor="#4a7c59" stopOpacity="1" />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4a7c59" stopOpacity="1" />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
            <Stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
            <Stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <Stop offset="70%" stopColor="#2d5f3f" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#1a2f1a" stopOpacity="0.4" />
          </RadialGradient>
          <RadialGradient id="innerGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
          </RadialGradient>
          <LinearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLogo: {
    borderRadius: 999,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 2,
    borderColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fallbackText: {
    textAlign: 'center',
    color: '#6366f1',
  },
  fallbackSubtext: {
    position: 'absolute',
    bottom: '15%',
    textAlign: 'center',
    color: '#8b5cf6',
    fontWeight: 'bold',
  },
});

export default TribeFindLogo; 