import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const mockHistory = [
  {
    id: '1',
    date: '2025-01-15',
    items: ['Milk', 'Bread', 'Eggs'],
    total: 15.99,
  },
  {
    id: '2',
    date: '2025-01-14',
    items: ['Apples', 'Bananas', 'Orange Juice'],
    total: 12.50,
  },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Purchase History</Text>
      
      <FlatList
        data={mockHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.items}>{item.items.join(', ')}</Text>
            <Text style={styles.total}>${item.total.toFixed(2)}</Text>
          </View>
        )}
      />
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
  historyItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 10,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : Platform.OS === 'android'
      ? {
          elevation: 2,
        }
      : {}), // Empty object for web platform
  },
  date: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  items: {
    fontSize: 15,
    color: '#3C3C43',
    marginBottom: 8,
  },
  total: {
    fontSize: 17,
    fontWeight: '600',
    color: '#32D74B',
  },
});
