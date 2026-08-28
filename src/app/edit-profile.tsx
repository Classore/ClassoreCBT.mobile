import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  Alert 
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUserProfile } = useAuth();

  const [fullName, setFullName] = useState(
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : (user?.username || 'Daniel Adekunle')
  );
  const [email, setEmail] = useState(user?.email || 'daniel.adekunle@example.com');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '+234 801 234 5678');
  const [dateOfBirth, setDateOfBirth] = useState('15 May 2002');
  const [gender, setGender] = useState('Male');
  const [state, setState] = useState(user?.state || 'Lagos');
  const [school, setSchool] = useState(user?.school || 'Lagos State University');
  const [classLevel, setClassLevel] = useState('200 Level');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ');

      await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber.trim(),
        gender: gender,
        state: state.trim(),
        school: school.trim(),
        class_level: classLevel.trim(),
      });

      Alert.alert('Success', 'Profile changes saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save profile changes. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from all devices?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar with Camera Overlay */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' }}
                style={styles.avatarImage}
                contentFit="cover"
              />
              <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8}>
                <Feather name="camera" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Number with Flag */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={[styles.inputContainer, styles.phoneInputContainer]}>
                <View style={styles.flagContainer}>
                  <Text style={{ fontSize: 18, marginRight: 6 }}>🇳🇬</Text>
                  <Feather name="chevron-down" size={12} color="#6B7280" />
                </View>
                <TextInput
                  style={[styles.textInput, { marginLeft: 10 }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+234 800 000 0000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <View style={[styles.inputContainer, styles.dropdownContainer]}>
                <TextInput
                  style={styles.textInput}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="DD Month YYYY"
                  placeholderTextColor="#9CA3AF"
                />
                <Feather name="calendar" size={16} color="#9CA3AF" />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7}>
                <Text style={styles.dropdownValueText}>{gender}</Text>
                <Feather name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* State */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>State</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7}>
                <Text style={styles.dropdownValueText}>{state}</Text>
                <Feather name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* School (Optional) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>School (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={school}
                  onChangeText={setSchool}
                  placeholder="Enter school name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Class / Level */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Class / Level</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7}>
                <Text style={styles.dropdownValueText}>{classLevel}</Text>
                <Feather name="chevron-down" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Change Password */}
            <TouchableOpacity 
              style={styles.changePasswordCard} 
              activeOpacity={0.7}
              onPress={() => router.push('/auth/reset-password')}
            >
              <Feather name="lock" size={18} color="#4B5563" style={{ marginRight: 12 }} />
              <Text style={styles.changePasswordText}>Change Password</Text>
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Log Out Button */}
            <TouchableOpacity 
              style={styles.logoutCard} 
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Feather name="log-out" size={20} color="#EF4444" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.logoutTitle}>Log Out</Text>
                <Text style={styles.logoutSubtitle}>Log out from all devices</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#4C1D95',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6D28D9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form Fields
  form: {
    gap: 18,
  },
  fieldGroup: {},
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  dropdownValueText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },

  // Change Password
  changePasswordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 6,
  },
  changePasswordText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  // Log Out
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 8,
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  logoutSubtitle: {
    fontSize: 11.5,
    color: '#F87171',
    marginTop: 1,
  },
});
