const fs = require('fs');
const file = 'src/app/weak-topics.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add Alert
content = content.replace(
  /ActivityIndicator/g,
  'ActivityIndicator, Alert'
);

// Filters State and logic
const stateAndLogic = \
  const [examFilter, setExamFilter] = useState('All Exams');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [sortFilter, setSortFilter] = useState('Worst First');

  const handleFilterExams = () => {
    Alert.alert('Select Exam', 'Filter by exam type', [
      { text: 'All Exams', onPress: () => setExamFilter('All Exams') },
      { text: 'JAMB', onPress: () => setExamFilter('JAMB') },
      { text: 'WAEC', onPress: () => setExamFilter('WAEC') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleFilterSubjects = () => {
    Alert.alert('Select Subject', 'Filter by subject', [
      { text: 'All Subjects', onPress: () => setSubjectFilter('All Subjects') },
      { text: 'Mathematics', onPress: () => setSubjectFilter('Mathematics') },
      { text: 'English', onPress: () => setSubjectFilter('English') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleSort = () => {
    Alert.alert('Sort By', 'Sort weak topics', [
      { text: 'Worst First', onPress: () => setSortFilter('Worst First') },
      { text: 'Best First', onPress: () => setSortFilter('Best First') },
      { text: 'Recent', onPress: () => setSortFilter('Recent') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };
\;

content = content.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\\n' + stateAndLogic);

// Replace fetch parameters
content = content.replace(
  'const response = await examService.getGlobalWeakTopics();',
  'const response = await examService.getGlobalWeakTopics({ exam: examFilter, subject: subjectFilter, sort: sortFilter });'
);

// Update useEffect dependencies
content = content.replace(
  '}, []);',
  '}, [examFilter, subjectFilter, sortFilter]);'
);

// Replace pills
content = content.replace(
  /<View style=\{styles\.filterRow\}>([\s\S]*?)<\/View>/g,
  \<View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7} onPress={handleFilterExams}>
              <Text style={styles.filterPillText}>{examFilter}</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7} onPress={handleFilterSubjects}>
              <Text style={styles.filterPillText}>{subjectFilter}</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterPill} activeOpacity={0.7} onPress={handleSort}>
              <MaterialCommunityIcons name="swap-vertical" size={14} color="#6B7280" style={{ marginRight: 2 }} />
              <Text style={styles.filterPillText}>{sortFilter}</Text>
              <Feather name="chevron-down" size={12} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>\
);

// Replace practice button route
content = content.replace(
  /onPress=\{\(\) => router\.push\('\/\(tabs\)\/practice'\)\}/g,
  'onPress={() => router.push(\/(tabs)/practice/practice-setup?topic_id=\&subject=\\)}'
);

fs.writeFileSync(file, content, 'utf8');
console.log('weak-topics.tsx updated successfully');
