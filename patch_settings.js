const fs = require('fs');
const file = 'src/app/settings.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';",
  "import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';"
);
content = content.replace(
  "import React from 'react';",
  "import React, { useState, useEffect } from 'react';\nimport { api } from '@/services/api';"
);

const stateLogic = \
  const [preferences, setPreferences] = useState<any>(null);

  useEffect(() => {
    api.get('/api/user/preferences/me/').then(res => setPreferences(res.data)).catch(console.error);
  }, []);

  const updatePreference = async (key: string, value: any) => {
    try {
      setPreferences((prev: any) => ({ ...prev, [key]: value }));
      await api.patch('/api/user/preferences/me/', { [key]: value });
    } catch(err) {
      console.error(err);
    }
  };

  const handleSecurity = () => {
    const isEnabled = preferences?.two_factor_auth || false;
    Alert.alert('Security (2FA)', 'Toggle Two-Factor Authentication?', [
      { text: 'Cancel', style: 'cancel' },
      { text: isEnabled ? 'Disable' : 'Enable', onPress: () => updatePreference('two_factor_auth', !isEnabled) }
    ]);
  };

  const handleAppearance = () => {
    Alert.alert('Appearance', 'Select Theme', [
      { text: 'Light Mode', onPress: () => updatePreference('appearance', 'light') },
      { text: 'Dark Mode', onPress: () => updatePreference('appearance', 'dark') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleLanguage = () => {
    Alert.alert('Language', 'Select Language', [
      { text: 'English', onPress: () => updatePreference('language', 'en') },
      { text: 'French', onPress: () => updatePreference('language', 'fr') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy Settings', 'Your profile visibility', [
      { text: 'Public', onPress: () => updatePreference('privacy_settings', { visibility: 'public' }) },
      { text: 'Private', onPress: () => updatePreference('privacy_settings', { visibility: 'private' }) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleDataUsage = () => {
    Alert.alert('Data Usage', 'Select Data Saver mode', [
      { text: 'Standard', onPress: () => updatePreference('data_usage', 'standard') },
      { text: 'Data Saver', onPress: () => updatePreference('data_usage', 'saver') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };
\;

content = content.replace('const router = useRouter();', 'const router = useRouter();\\n' + stateLogic);

content = content.replace(
  /<TouchableOpacity style=\{styles\.settingItem\} activeOpacity=\{0\.7\}>\s*<View style=\{\[styles\.iconBg, \{ backgroundColor: '#ECFDF5' \}\]\}>\s*<Feather name="shield"/g,
  '<TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handleSecurity}>\n                <View style={[styles.iconBg, { backgroundColor: \\'#ECFDF5\\' }]}>\n                  <Feather name="shield"'
);
content = content.replace(
  '<Text style={styles.itemSubtitle}>Manage 2FA and active devices</Text>',
  '<Text style={styles.itemSubtitle}>{preferences?.two_factor_auth ? "2FA is Enabled" : "Manage 2FA and active devices"}</Text>'
);

content = content.replace(
  /<TouchableOpacity style=\{styles\.settingItem\} activeOpacity=\{0\.7\}>\s*<View style=\{\[styles\.iconBg, \{ backgroundColor: '#FEF3C7' \}\]\}>\s*<Feather name="sun"/g,
  '<TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handleAppearance}>\n                <View style={[styles.iconBg, { backgroundColor: \\'#FEF3C7\\' }]}>\n                  <Feather name="sun"'
);
content = content.replace(
  '<Text style={styles.itemSubtitle}>Light mode</Text>',
  '<Text style={styles.itemSubtitle}>{preferences?.appearance === "dark" ? "Dark mode" : "Light mode"}</Text>'
);

content = content.replace(
  /<TouchableOpacity style=\{styles\.settingItem\} activeOpacity=\{0\.7\}>\s*<View style=\{\[styles\.iconBg, \{ backgroundColor: '#EFF6FF' \}\]\}>\s*<Feather name="globe"/g,
  '<TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handleLanguage}>\n                <View style={[styles.iconBg, { backgroundColor: \\'#EFF6FF\\' }]}>\n                  <Feather name="globe"'
);
content = content.replace(
  '<Text style={styles.itemSubtitle}>English</Text>',
  '<Text style={styles.itemSubtitle}>{preferences?.language === "fr" ? "French" : "English"}</Text>'
);

content = content.replace(
  /<TouchableOpacity style=\{styles\.settingItem\} activeOpacity=\{0\.7\}>\s*<View style=\{\[styles\.iconBg, \{ backgroundColor: '#ECFDF5' \}\]\}>\s*<MaterialCommunityIcons name="shield-check-outline"/g,
  '<TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handlePrivacy}>\n                <View style={[styles.iconBg, { backgroundColor: \\'#ECFDF5\\' }]}>\n                  <MaterialCommunityIcons name="shield-check-outline"'
);

content = content.replace(
  /<TouchableOpacity style=\{styles\.settingItem\} activeOpacity=\{0\.7\}>\s*<View style=\{\[styles\.iconBg, \{ backgroundColor: '#EDE9FE' \}\]\}>\s*<Feather name="hard-drive"/g,
  '<TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handleDataUsage}>\n                <View style={[styles.iconBg, { backgroundColor: \\'#EDE9FE\\' }]}>\n                  <Feather name="hard-drive"'
);
content = content.replace(
  '<Text style={styles.itemSubtitle}>Manage your storage and data</Text>',
  '<Text style={styles.itemSubtitle}>{preferences?.data_usage === "saver" ? "Data Saver Mode On" : "Standard Data Usage"}</Text>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Settings successfully patched.');
