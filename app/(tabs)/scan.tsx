import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Platform, Alert, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingContext } from '@/context/ShoppingContext';
import { Camera, Camera as FlipCamera } from 'lucide-react-native';

type ScanMode = 'barcode' | 'receipt';
type FlashlightMode = 'on' | 'off';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [flashlight, setFlashlight] = useState<FlashlightMode>('off');
  const { addToHistory } = useShoppingContext();

  // Flag to indicate if we are actively waiting for a single scan result
  const [isActivelyScanning, setIsActivelyScanning] = useState(false);

  // State for the modal popup
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  // Ref to prevent multiple rapid calls due to state update delays
  const processingScan = useRef(false);

  useEffect(() => {
    // Reset processing ref if modal closes or scanning stops
    if (!modalVisible && !isActivelyScanning) {
      processingScan.current = false;
    }
  }, [modalVisible, isActivelyScanning]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center' }]}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Called when a barcode is detected by the CameraView
  const handleBarcodeScanned = async (scanningResult: BarcodeScanningResult) => {
    if (mode !== 'barcode' || !isActivelyScanning || processingScan.current) {
      return;
    }

    processingScan.current = true;
    setIsActivelyScanning(false);

    const { type, data } = scanningResult;
    console.log(`Barcode scanned! Type: ${type}, Data: ${data}`);

    try {
      const apiUrl = `https://eandata.com/feed/?v=3&mode=json&keycode=AD3684FB67E71F13&find=${data}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const productInfo = await response.json();

        if (productInfo.status === 'error') {
          throw new Error(productInfo.message || 'API returned an error');
        }

        const productData = productInfo.product || {};
        const attributes = productData.attributes || {};

        setScannedProduct({
          product: attributes.product || 'N/A',
          description: attributes.description || 'N/A',
          model: attributes.model || 'N/A',
          brand: attributes.brand || 'N/A',
          barcode: data
        });

        setModalVisible(true);
      } else {
        throw new Error(`Received non-JSON response from API. Content-Type: ${contentType}`);
      }
    } catch (error: any) {
      console.error("API Fetch Error:", error);
      Alert.alert('Error Fetching Product Info', error.message || 'An unknown error occurred.');
      processingScan.current = false;
    }
  };

  const handleCapture = () => {
    if (mode === 'barcode' && !processingScan.current) {
      setIsActivelyScanning(true);
    } else if (mode === 'receipt') {
      Alert.alert('Receipt Scanning', 'Receipt scanning feature coming soon!');
    }
  };

  const toggleFlashlight = () => {
    setFlashlight(current => (current === 'off' ? 'on' : 'off'));
  };

  const handleModalResponse = (shouldAdd: boolean) => {
    setModalVisible(false);
    if (shouldAdd && scannedProduct) {
      addToHistory([scannedProduct.product]);
      Alert.alert('Success', 'Product added to purchase history!');
    }
    setScannedProduct(null);
    processingScan.current = false;
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={flashlight === 'on'}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => handleModalResponse(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {scannedProduct ? (
              <>
                <Text style={styles.modalTitle}>Product Information</Text>
                <Text style={styles.modalText}>Barcode: {scannedProduct.barcode}</Text>
                <Text style={styles.modalText}>Product: {scannedProduct.product}</Text>
                <Text style={styles.modalText}>Description: {scannedProduct.description}</Text>
                <Text style={styles.modalText}>Model: {scannedProduct.model}</Text>
                <Text style={styles.modalText}>Brand: {scannedProduct.brand}</Text>
                <Text style={[styles.modalText, { marginTop: 15, fontWeight: 'bold' }]}>
                  Add to purchase history?
                </Text>
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonYes]} 
                    onPress={() => handleModalResponse(true)}
                  >
                    <Text style={styles.modalButtonText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonNo]} 
                    onPress={() => handleModalResponse(false)}
                  >
                    <Text style={styles.modalButtonText}>No</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.modalText}>Loading product info...</Text>
            )}
          </View>
        </View>
      </Modal>

      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 10 }]}>
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

        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            style={styles.sideButton} 
            onPress={toggleFlashlight} 
            disabled={processingScan.current}
          >
            <Text style={styles.iconText}>{flashlight === 'on' ? '💡' : '🔦'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.captureButton, processingScan.current && styles.captureButtonDisabled]} 
            onPress={handleCapture} 
            disabled={processingScan.current}
          >
            {isActivelyScanning ? (
              <Text style={styles.scanningText}>Scanning...</Text>
            ) : (
              <Camera color="white" size={32} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sideButton} 
            onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} 
            disabled={processingScan.current}
          >
            <FlipCamera color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const { height } = Dimensions.get('window');

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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modeText: {
    fontSize: 18,
    color: '#ccc',
    fontWeight: '500',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  modeTextActive: {
    color: 'white',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#FF3B30',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  captureButtonDisabled: {
    opacity: 0.5,
  },
  iconText: {
    fontSize: 24,
    color: 'white',
  },
  scanningText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    maxHeight: height * 0.8,
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 17,
    marginVertical: 5,
    color: '#444',
    lineHeight: 24,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonYes: {
    backgroundColor: '#4CD964',
  },
  modalButtonNo: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});