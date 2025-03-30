import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Platform, Modal } from 'react-native';
import { Plus, Check, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type GroceryItem = {
  id: string;
  name: string;
  completed: boolean;
};

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);

  const addItem = () => {
    if (newItem.trim()) {
      setItems([...items, { id: Date.now().toString(), name: newItem.trim(), completed: false }]);
      setNewItem('');
    }
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Shopping List</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newItem}
          onChangeText={setNewItem}
          placeholder="Add new item..."
          onSubmitEditing={addItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <TouchableOpacity
              style={[styles.checkbox, item.completed && styles.checkboxChecked]}
              onPress={() => toggleItem(item.id)}
            >
              {item.completed && <Check size={16} color="white" />}
            </TouchableOpacity>
            <Text style={[styles.itemText, item.completed && styles.itemTextCompleted]}>
              {item.name}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteItem(item.id)}
            >
              <Trash2 size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        style={styles.list}
      />

      {/* Modal Popup for displaying scanned product info */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {scannedProduct ? (
              <>
                <Text style={styles.modalTitle}>Product Information</Text>
                <Text style={styles.modalText}>Product: {scannedProduct.product}</Text>
                <Text style={styles.modalText}>Description: {scannedProduct.description}</Text>
                <Text style={styles.modalText}>Model: {scannedProduct.model}</Text>
                <Text style={styles.modalText}>Brand: {scannedProduct.brand}</Text>
                <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.modalText}>Loading product info...</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginVertical: 20,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  itemText: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  deleteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 18,
    marginVertical: 4,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 20,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
  },
});
