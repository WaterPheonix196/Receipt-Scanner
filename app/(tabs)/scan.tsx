import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Platform, Alert, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScanMode = 'barcode' | 'receipt';
type FlashlightMode = 'on' | 'off';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [flashlight, setFlashlight] = useState<FlashlightMode>('off');

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
  }, [modalVisible, isActivelyScanning])

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
    // 1. Check if we are in the correct mode and actively waiting for a scan
    // 2. Use ref to prevent race conditions/multiple triggers before state updates
    if (mode !== 'barcode' || !isActivelyScanning || processingScan.current) {
      return;
    }

    // --- CRITICAL SECTION START ---
    // Immediately mark as processing and disable further scans for this trigger
    processingScan.current = true;
    setIsActivelyScanning(false);
    // --- CRITICAL SECTION END ---

    const { type, data } = scanningResult;
    console.log(`(PROCESS) Barcode scanned! Type: ${type}, Data: ${data}`); // Log only when processed

    // Construct the API URL using the scanned barcode data
    const apiUrl = `https://eandata.com/feed/?v=3&mode=json&keycode=AD3684FB67E71F13&find=${data}`;

    try {
      const response = await fetch(apiUrl);
      // Check if response is ok AND is valid JSON before parsing
      if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          const productInfo = await response.json();

          // Check for API-specific error indicators if necessary
          if (productInfo.status === 'error') {
             throw new Error(productInfo.message || 'API returned an error');
          }

          // Prepare product details from the API response
          const productData = productInfo.product || {}; // Handle cases where product might be missing
          const attributes = productData.attributes || {}; // Handle cases where attributes might be missing

          setScannedProduct({
            product: attributes.product || 'N/A',
            description: attributes.description || 'N/A',
            model: attributes.model || 'N/A',
            brand: attributes.brand || 'N/A',
            barcode: data // Include barcode for context if needed
          });

          // Show modal popup with product details
          setModalVisible(true);
      } else {
           throw new Error(`Received non-JSON response from API. Content-Type: ${contentType}`);
      }

    } catch (error: any) {
      console.error("API Fetch Error:", error);
      Alert.alert('Error Fetching Product Info', error.message || 'An unknown error occurred.');
      // Reset processing flag on error so user can try again
       processingScan.current = false;
    }
    // Note: processingScan.current is reset when the modal is closed or if an error occurs
  };

  // When the capture button is pressed: enable scanning temporarily.
  const handleCapture = () => {
    console.log(`Capture button pressed in ${mode} mode.`);
    if (mode === 'barcode') {
        // Only start scanning if not already processing a previous scan
      if (!processingScan.current) {
          console.log('Waiting for barcode scan...');
          setIsActivelyScanning(true);
          // Optional: Add a timeout to automatically stop scanning if nothing found
          // setTimeout(() => {
          //     if (isActivelyScanning) {
          //         console.log("Scan timed out.");
          //         setIsActivelyScanning(false);
          //     }
          // }, 5000); // e.g., 5 seconds timeout
      } else {
          console.log('Already processing a scan, please wait.');
      }

    } else {
      alert('Receipt capture not implemented yet.');
    }
  };

  const toggleFlashlight = () => {
    setFlashlight(current => (current === 'off' ? 'on' : 'off'));
    console.log(`Flashlight toggled ${flashlight === 'off' ? 'on' : 'off'}`);
  };

  const openLibrary = () => {
    console.log('Photo Library button pressed.');
    alert('Photo Library feature not implemented yet.');
  };

  // Handle response from modal popup buttons
  const handleModalResponse = (shouldAdd: boolean) => {
    setModalVisible(false); // Close modal first
    if (shouldAdd) {
      // TODO: Integrate with your "recently purchased" list (replace this console log)
      console.log('Product added to recently purchased:', scannedProduct);
    } else {
      console.log('Product not added.');
    }
    // Clear product info and reset processing flag AFTER handling modal response
    setScannedProduct(null);
    processingScan.current = false; // Allow new scans now
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={flashlight === 'on'}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
          // You might experiment with interval, but the core logic change is more robust
          // interval: 1000, // Optional: Increase interval if needed, but may slow down detection
        }}
        // The listener is always attached, but handleBarcodeScanned decides if it should process
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Modal Popup for displaying scanned product info */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => handleModalResponse(false)} // Handle back button press on Android
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
                <Text style={[styles.modalText, {marginTop: 15, fontWeight: 'bold'}]}>Add to recently purchased?</Text>
                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonYes]} onPress={() => handleModalResponse(true)}>
                    <Text style={styles.modalButtonText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonNo]} onPress={() => handleModalResponse(false)}>
                    <Text style={styles.modalButtonText}>No</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.modalText}>Loading product info...</Text> // Should not be visible long
            )}
          </View>
        </View>
      </Modal>

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
          <TouchableOpacity style={styles.sideButton} onPress={openLibrary} disabled={processingScan.current}>
             <Text style={styles.iconText}>🖼️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleCapture} disabled={processingScan.current}>
            {/* Add spinner or indicator if processingScan.current is true? */}
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={toggleFlashlight} disabled={processingScan.current}>
             <Text style={styles.iconText}>{flashlight === 'on' ? '💡' : '🔦'}</Text>
          </TouchableOpacity>
        </View>
         {/* Optional: Indicate scanning state */}
         {isActivelyScanning && <Text style={styles.scanningIndicator}>Scanning...</Text>}
      </View>
    </View>
  );
}

const { height, width } = Dimensions.get('window');

// --- Styles remain largely the same, added scanningIndicator and minor modal button styling ---
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
    backgroundColor: 'rgba(0,0,0,0.4)', // Slightly dimmed background for controls
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15, // Reduced margin slightly
  },
  modeText: {
    fontSize: 18,
    color: '#ccc', // Lighter grey
    fontWeight: '500',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  modeTextActive: {
    color: 'white',
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#FF3B30', // Highlight active mode
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker overlay
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20, // Add padding for smaller screens
  },
  modalContainer: {
    // height: height * 0.7, // Removed fixed height, let content define it
    maxHeight: height * 0.8, // Max height constraint
    width: '100%', // Use full width within overlay padding
    maxWidth: 500, // Max width for larger screens/tablets
    backgroundColor: 'white',
    borderRadius: 15, // Slightly softer corners
    padding: 25, // Increased padding
    justifyContent: 'space-between', // Ensure buttons are at bottom if content is short
  },
  modalTitle: {
    fontSize: 24, // Larger title
    fontWeight: 'bold',
    marginBottom: 15, // More space below title
    textAlign: 'center',
    color: '#333',
  },
  modalText: {
    fontSize: 17, // Slightly smaller text for details
    marginVertical: 5, // Consistent vertical spacing
    color: '#444', // Darker grey text
    lineHeight: 24, // Improve readability
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25, // More space above buttons
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee', // Separator line
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 30, // Wider buttons
    borderRadius: 8, // Softer button corners
    minWidth: 100, // Minimum width
    alignItems: 'center', // Center text
  },
  modalButtonYes: {
     backgroundColor: '#4CD964', // Green for 'Yes'
  },
  modalButtonNo: {
     backgroundColor: '#FF3B30', // Red for 'No'
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scanningIndicator: {
      color: 'white',
      textAlign: 'center',
      marginTop: 10,
      fontSize: 16,
      fontWeight: 'bold',
  },
});