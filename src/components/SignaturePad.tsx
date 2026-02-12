import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { COLORS, BORDER_RADIUS } from '../utils/constants';

interface SignaturePadProps {
  onSignatureChange?: (signature: string) => void;
  penColor?: string;
  backgroundColor?: string;
}

export interface SignaturePadRef {
  clearSignature: () => void;
  getSignature: () => void;
  isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSignatureChange, penColor = '#000000', backgroundColor = 'rgba(0,0,0,0)' }, ref) => {
    const signatureRef = useRef<any>(null);
    const isEmptyRef = useRef(true);

    useImperativeHandle(ref, () => ({
      clearSignature: () => {
        signatureRef.current?.clearSignature();
        isEmptyRef.current = true;
      },
      getSignature: () => {
        signatureRef.current?.readSignature();
      },
      isEmpty: () => isEmptyRef.current,
    }));

    const handleSignature = (signature: string) => {
      onSignatureChange?.(signature);
    };

    const handleBegin = () => {
      isEmptyRef.current = false;
    };

    const handleEmpty = () => {
      isEmptyRef.current = true;
    };

    const webStyle = `.m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: transparent;
    }
    .m-signature-pad--body {
      border: none;
      background-color: ${backgroundColor};
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      background-color: ${backgroundColor};
    }`;

    return (
      <View style={styles.container}>
        <SignatureCanvas
          ref={signatureRef}
          onOK={handleSignature}
          onBegin={handleBegin}
          onEmpty={handleEmpty}
          webStyle={webStyle}
          penColor={penColor}
          backgroundColor={backgroundColor}
          dataURL=""
          autoClear={false}
          imageType="image/png"
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
});

export default SignaturePad;
