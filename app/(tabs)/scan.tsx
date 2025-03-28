import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import React, { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Consider adding icons later with: import { Ionicons } from '@expo/vector-icons';

type ScanMode = 'barcode' | 'receipt';
type FlashlightMode = 'on' | 'off';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [flashlight, setFlashlight] = useState<FlashlightMode>('off');
  const [scanned, setScanned] = useState(false); // State to prevent multiple alerts for one scan
  const [isScanningActive, setIsScanningActive] = useState(false); // State to control when to process scan

  useEffect(() => {
    // Reset states when mode changes
    setScanned(false);
    setIsScanningActive(false);
  }, [mode]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center' }]}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
    // Only process if we initiated a scan AND haven't already processed this scan instance
    if (!isScanningActive || scanned) return;

    setScanned(true); // Mark as scanned for this attempt
    setIsScanningActive(false); // We got a result, stop listening for more until next button press
    const { type, data } = scanningResult;
    console.log(`Barcode scanned! Type: ${type}, Data: ${data}`);

    // TODO: Implement item matching logic here
    // For now, just show an alert
    Alert.alert(
      'Barcode Scanned',
      `Type: ${type}\nData: ${data}`,
      [{ text: 'OK', onPress: () => setScanned(false) }] // Reset scanned state on dismiss, isScanningActive is already false
    );
  };

  const handleCapture = () => {
    console.log(`Capture button pressed in ${mode} mode.`);
    if (mode === 'barcode') {
      // Initiate scanning process
      setScanned(false); // Allow a new scan result to be processed
      setIsScanningActive(true); // Signal that we are now waiting for a scan result
      console.log('Barcode scanning initiated...');
      // The actual scanning is handled by onBarcodeScanned when active
    } else {
      // Placeholder for taking a picture for OCR
      alert('Receipt capture not implemented yet.');
      // Example: takePicture(); // You'd need to implement takePicture function
    }
  };

  const toggleFlashlight = () => {
    setFlashlight(current => (current === 'off' ? 'on' : 'off'));
    console.log(`Flashlight toggled ${flashlight === 'off' ? 'on' : 'off'}`);
  };

  const openLibrary = () => {
    console.log('Photo Library button pressed.');
    alert('Photo Library feature not implemented yet.');
    // TODO: Implement image picking
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={flashlight === 'on'}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"], // Common barcode types
        }}
        // Keep the scanner listening in barcode mode, but the handler controls processing
        onBarcodeScanned={mode === 'barcode' ? handleBarcodeScanned : undefined}
      />

      {/* Controls Overlay */}
      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 10 }]}>
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity onPress={() => setMode('barcode')}>
            <Text style={[styles.modeText, mode === 'barcode' && styles.modeTextActive]}>
              Barcode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('receipt')}>
            <Text style={[styles.modeText, mode === 'receipt' && styles.modeTextActive]}>
              Receipt
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Buttons Row */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.sideButton} onPress={openLibrary}>
            <Text style={styles.iconText}>🖼️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            {/* Inner icon could indicate mode, e.g., barcode symbol or camera */}
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={toggleFlashlight}>
            <Text style={styles.iconText}>{flashlight === 'on' ? '💡' : '🔦'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modeText: {
    fontSize: 18,
    color: '#aaa',
    fontWeight: '500',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  modeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideButton: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: 'rgba(100, 100, 100, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  iconText: {
    fontSize: 24,
    color: 'white',
  },
});
