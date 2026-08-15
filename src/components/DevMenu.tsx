import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const ROUTES = [
  { name: 'Root / Splash', path: '/' },
  { name: 'Signup', path: '/(auth)/signup' },
  { name: 'Verify Email', path: '/(auth)/verify-email' },
  { name: 'Choose Goal', path: '/(auth)/choose-goal' },
  { name: 'Login', path: '/auth/login' },
  { name: 'Forgot Password', path: '/auth/forgot-password' },
  { name: 'Reset Password', path: '/auth/reset-password' },
  { name: 'Reset Confirm', path: '/auth/password-reset-confirm' },
  { name: 'Success (Pwd Changed)', path: '/auth/success' },
  { name: 'Home (Tabs)', path: '/(tabs)' },
  { name: 'Exam Instructions', path: '/(exam)/instructions' },
  { name: 'Exam Session', path: '/(exam)/session' },
];

export function DevMenu() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  // Only show in development
  if (!__DEV__) return null;

  const navigateTo = (path: string) => {
    setIsVisible(false);
    try {
      router.push(path as any);
    } catch (e) {
      console.warn("Failed to navigate to", path, e);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>DEV</Text>
      </TouchableOpacity>

      {/* Navigation Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Dev Navigation</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>X</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={ROUTES}
              keyExtractor={(item) => item.path}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.routeItem} 
                  onPress={() => navigateTo(item.path)}
                >
                  <Text style={styles.routeName}>{item.name}</Text>
                  <Text style={styles.routePath}>{item.path}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100, // Above typical tab bars
    right: 20,
    backgroundColor: '#FF3B30',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
  fabText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  closeBtnText: {
    fontWeight: 'bold',
    color: '#333',
  },
  routeItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  routePath: {
    fontSize: 12,
    color: '#888',
  },
});
