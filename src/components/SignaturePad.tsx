import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';

interface SignaturePadProps {
  onSignatureChange?: (signature: string) => void;
  penColor?: string;
  strokeWidth?: number;
}

export interface SignaturePadRef {
  clearSignature: () => void;
  getSignature: () => void;
  isEmpty: () => boolean;
}

interface Point {
  x: number;
  y: number;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSignatureChange, penColor = '#000000', strokeWidth = 3 }, ref) => {
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const viewShotRef = React.useRef<ViewShot>(null);

    const isEmpty = useCallback(() => {
      return paths.length === 0 && currentPath === '';
    }, [paths, currentPath]);

    const clearSignature = useCallback(() => {
      setPaths([]);
      setCurrentPath('');
    }, []);

    const captureSignature = useCallback(async () => {
      if (isEmpty()) {
        return;
      }

      try {
        const uri = await viewShotRef.current?.capture?.();
        if (uri) {
          // Convert to base64 data URI
          const response = await fetch(uri);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          onSignatureChange?.(base64);
        }
      } catch (error) {
        console.error('Error capturing signature:', error);
      }
    }, [isEmpty, onSignatureChange]);

    useImperativeHandle(ref, () => ({
      clearSignature,
      getSignature: captureSignature,
      isEmpty,
    }));

    const addToPath = useCallback((x: number, y: number, isStart: boolean) => {
      if (isStart) {
        setCurrentPath(`M ${x} ${y}`);
      } else {
        setCurrentPath(prev => `${prev} L ${x} ${y}`);
      }
    }, []);

    const finishPath = useCallback(() => {
      if (currentPath) {
        setPaths(prev => [...prev, currentPath]);
        setCurrentPath('');
      }
    }, [currentPath]);

    const panGesture = Gesture.Pan()
      .minDistance(0)
      .onStart((event) => {
        'worklet';
        runOnJS(addToPath)(event.x, event.y, true);
      })
      .onUpdate((event) => {
        'worklet';
        runOnJS(addToPath)(event.x, event.y, false);
      })
      .onEnd(() => {
        'worklet';
        runOnJS(finishPath)();
      });

    return (
      <View style={styles.container}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.canvasContainer}>
            {/* Signature guide - always visible */}
            <View style={styles.guideContainer} pointerEvents="none">
              <Text style={styles.guideX}>✕</Text>
              <View style={styles.guideLine} />
            </View>

            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
              style={styles.viewShot}
            >
              <View style={styles.canvas}>
                <Svg style={StyleSheet.absoluteFill}>
                  {paths.map((path, index) => (
                    <Path
                      key={index}
                      d={path}
                      stroke={penColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {currentPath ? (
                    <Path
                      d={currentPath}
                      stroke={penColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                </Svg>
              </View>
            </ViewShot>
          </View>
        </GestureDetector>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  canvasContainer: {
    flex: 1,
  },
  viewShot: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  guideContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: '30%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  guideX: {
    fontSize: 28,
    color: '#888888',
    marginRight: 10,
    marginBottom: -6,
    fontWeight: '300',
  },
  guideLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#888888',
  },
});

export default SignaturePad;
