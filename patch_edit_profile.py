import sys

file_path = r'C:\Users\GFA\Documents\GitHub\ClassoreCBT.mobile\src\app\edit-profile.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
if 'Modal,' not in content:
    content = content.replace(
        'View\n} from \'react-native\';',
        'View,\n  Modal,\n  FlatList\n} from \'react-native\';'
    )

# 2. Add state and logic
state_and_logic = '''
  const [isSaving, setIsSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'gender' | 'state' | 'classLevel' | null>(null);

  const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];
  const STATE_OPTIONS = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
  ];
  const CLASS_OPTIONS = ['SS 1', 'SS 2', 'SS 3', 'UTME', 'Undergraduate', 'Graduate', 'Other'];

  const openModal = (type: 'gender' | 'state' | 'classLevel') => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelectOption = (item: string) => {
    if (modalType === 'gender') setGender(item);
    else if (modalType === 'state') setState(item);
    else if (modalType === 'classLevel') setClassLevel(item);
    setModalVisible(false);
  };

  const getOptions = () => {
    if (modalType === 'gender') return GENDER_OPTIONS;
    if (modalType === 'state') return STATE_OPTIONS;
    if (modalType === 'classLevel') return CLASS_OPTIONS;
    return [];
  };
'''
if 'const getOptions' not in content:
    content = content.replace('  const [isSaving, setIsSaving] = useState(false);', state_and_logic)

# 3. Add Modal to the end of SafeAreaView
modal_jsx = '''
        {/* Selection Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalType === 'gender' ? 'Select Gender' : modalType === 'state' ? 'Select State' : 'Select Class/Level'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={getOptions()}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleSelectOption(item)}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                    {((modalType === 'gender' && gender === item) ||
                      (modalType === 'state' && state === item) ||
                      (modalType === 'classLevel' && classLevel === item)) && (
                      <Feather name="check" size={20} color="#6D28D9" />
                    )}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
'''
if '<Modal' not in content:
    content = content.replace('      </View>\n    </SafeAreaView>', modal_jsx)

# 4. Modify TouchableOpacity onPress
content = content.replace(
'''            {/* Gender */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7}>''',
'''            {/* Gender */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7} onPress={() => openModal('gender')}>'''
)

content = content.replace(
'''            {/* State */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>State</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7}>''',
'''            {/* State */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>State</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7} onPress={() => openModal('state')}>'''
)

content = content.replace(
'''            {/* Class / Level */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Class / Level</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7}>''',
'''            {/* Class / Level */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Class / Level</Text>
              <TouchableOpacity style={[styles.inputContainer, styles.dropdownContainer]} activeOpacity={0.7} onPress={() => openModal('classLevel')}>'''
)

# 5. Add Styles
styles_content = '''
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});'''

if 'modalOverlay:' not in content:
    content = content.replace(
'''  // Log Out
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
});''', styles_content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Update complete')
