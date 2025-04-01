import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingContext } from '@/context/ShoppingContext';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history } = useShoppingContext();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Purchase History</Text>
      
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.items}>{item.items.join(', ')}</Text>
            <Text style={styles.total}>${item.total.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No purchase history yet.</Text>
            <Text style={styles.emptySubtext}>
              Scan items or add them to your shopping list to see them here.
            </Text>
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {}, // Default case for web
    }),
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});