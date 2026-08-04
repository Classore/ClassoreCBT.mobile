import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

// Custom Hook for Timer
function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds(s => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const formatTime = (timeInSeconds: number) => {
    const h = Math.floor(timeInSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeInSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return formatTime(seconds);
}

export default function ExamSessionScreen() {
  const router = useRouter();
  
  // Timer (2 hours = 7200 seconds)
  const timeString = useCountdown(7200);

  // States
  const [activeSubject, setActiveSubject] = useState('Mathematics');
  const [selectedOption, setSelectedOption] = useState<string | null>('B');
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Modal States
  const [showCalculator, setShowCalculator] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry'];
  const options = [
    { id: 'A', text: '2πr' },
    { id: 'B', text: 'πr²' },
    { id: 'C', text: 'πd' },
    { id: 'D', text: '2πr²' }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowExit(true)}>
            <SymbolView name="line.3.horizontal" size={20} tintColor="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>JAMB UTME 2025 Mock</Text>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{timeString}</Text>
          </View>
        </View>

        {/* Subjects Horizontal List */}
        <View style={styles.subjectsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {subjects.map(subject => (
              <TouchableOpacity 
                key={subject} 
                style={[styles.subjectPill, activeSubject === subject && styles.subjectPillActive]}
                onPress={() => setActiveSubject(subject)}
              >
                <Text style={[styles.subjectText, activeSubject === subject && styles.subjectTextActive]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Question Area */}
        <ScrollView style={styles.questionArea} showsVerticalScrollIndicator={false}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumberText}>Question 1 of 400</Text>
            <TouchableOpacity style={styles.bookmarkButton} onPress={() => setIsBookmarked(!isBookmarked)}>
              <SymbolView name={isBookmarked ? 'bookmark.fill' : 'bookmark'} size={20} tintColor={isBookmarked ? '#F59E0B' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <Text style={styles.questionText}>
            Which of the following is the correct formula for calculating the area of a circle?
          </Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {options.map(opt => (
              <TouchableOpacity 
                key={opt.id}
                style={[styles.optionCard, selectedOption === opt.id && styles.optionCardSelected]}
                onPress={() => setSelectedOption(opt.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionLabel, selectedOption === opt.id && styles.optionLabelSelected]}>
                  {opt.id}
                </Text>
                <Text style={styles.optionContent}>{opt.text}</Text>
                {selectedOption === opt.id && (
                  <View style={styles.checkedCircle}>
                    <SymbolView name="checkmark" size={12} tintColor="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={{height: 100}} />
        </ScrollView>

        {/* Previous / Next Buttons */}
        <View style={styles.navButtonsContainer}>
          <TouchableOpacity style={styles.prevButton}>
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Bottom Tab Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBarItem} onPress={() => setShowCalculator(true)}>
            <SymbolView name="candybarphone" size={24} tintColor="#6B7280" />
            <Text style={styles.bottomBarText}>Calculator</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bottomBarItem} onPress={() => setShowPalette(true)}>
            <SymbolView name="square.grid.2x2" size={24} tintColor="#6B7280" />
            <Text style={styles.bottomBarText}>Question Palette</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bottomBarItem}>
            <SymbolView name="flag" size={24} tintColor="#EF4444" />
            <Text style={[styles.bottomBarText, { color: '#EF4444' }]}>Submit Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bottomBarItem}>
            <SymbolView name="headphones" size={24} tintColor="#6B7280" />
            <Text style={styles.bottomBarText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Calculator Modal */}
      <Modal visible={showCalculator} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calculatorCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calculator</Text>
              <TouchableOpacity onPress={() => setShowCalculator(false)}>
                <SymbolView name="xmark" size={20} tintColor="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.calcDisplay}>
              <Text style={styles.calcDisplayText}>0</Text>
            </View>
            <View style={styles.calcGrid}>
              {['(', ')', '%', 'AC', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[
                    styles.calcBtn, 
                    btn === 'AC' || btn === '=' ? styles.calcBtnPurple : null
                  ]}
                >
                  <Text style={[
                    styles.calcBtnText, 
                    btn === 'AC' || btn === '=' ? styles.calcBtnTextWhite : null
                  ]}>{btn}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Question Palette Modal */}
      <Modal visible={showPalette} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.paletteCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Question Palette</Text>
              <TouchableOpacity onPress={() => setShowPalette(false)}>
                <SymbolView name="xmark" size={20} tintColor="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.paletteLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#6D28D9' }]} /><Text style={styles.legendText}>Answered</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} /><Text style={styles.legendText}>Current</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} /><Text style={styles.legendText}>Not Answered</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Marked</Text></View>
            </View>
            <ScrollView style={styles.paletteScroll}>
              <View style={styles.paletteGrid}>
                {Array.from({ length: 50 }).map((_, i) => {
                  const num = i + 1;
                  // Mock some states
                  let stateStyle = styles.paletteBtnDefault;
                  let textStyle = styles.paletteBtnTextDefault;
                  if (num <= 10 || num === 20 || num === 30) {
                    stateStyle = styles.paletteBtnAnswered;
                    textStyle = styles.paletteBtnTextAnswered;
                  }
                  if (num === 11) {
                    stateStyle = styles.paletteBtnCurrent;
                    textStyle = styles.paletteBtnTextAnswered; // white text
                  }
                  if (num === 6) {
                    stateStyle = styles.paletteBtnMarked;
                  }

                  return (
                    <TouchableOpacity key={num} style={[styles.paletteBtn, stateStyle]}>
                      <Text style={[styles.paletteBtnText, textStyle]}>{num}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.paletteFooter}>
              <TouchableOpacity><SymbolView name="chevron.left" size={20} tintColor="#111827" /></TouchableOpacity>
              <TouchableOpacity><SymbolView name="chevron.right" size={20} tintColor="#111827" /></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exit Test Modal */}
      <Modal visible={showExit} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.exitCard}>
            <View style={styles.exitHeader}>
              <View style={styles.exitIconBg}>
                <SymbolView name="rectangle.portrait.and.arrow.right" size={24} tintColor="#EF4444" />
              </View>
              <TouchableOpacity onPress={() => setShowExit(false)} style={styles.closeExitBtn}>
                <SymbolView name="xmark" size={20} tintColor="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.exitTitle}>Exit Test?</Text>
            <Text style={styles.exitSubtitle}>Are you sure you want to exit the test?</Text>
            <Text style={styles.exitDesc}>Your progress will not be saved and you will need to start over if you return.</Text>
            
            <View style={styles.warningBox}>
              <SymbolView name="exclamationmark.triangle" size={16} tintColor="#EF4444" />
              <Text style={styles.warningText}>Time spent will be lost and any unanswered questions will not be counted.</Text>
            </View>

            <View style={styles.exitActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowExit(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exitBtn} onPress={() => { setShowExit(false); router.back(); }}>
                <Text style={styles.exitBtnText}>Exit Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  menuButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  timerBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  timerText: { color: '#6D28D9', fontWeight: 'bold', fontSize: 14 },
  subjectsContainer: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  subjectPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 12 },
  subjectPillActive: { backgroundColor: '#6D28D9' },
  subjectText: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
  subjectTextActive: { color: '#FFF' },
  questionArea: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  questionNumberText: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  bookmarkButton: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#111827', lineHeight: 28, marginBottom: 24 },
  optionsList: { gap: 16 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' },
  optionCardSelected: { borderColor: '#6D28D9', borderWidth: 2, backgroundColor: '#F9F5FF' },
  optionLabel: { fontSize: 16, fontWeight: 'bold', color: '#9CA3AF', marginRight: 16 },
  optionLabelSelected: { color: '#6D28D9' },
  optionContent: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '600' },
  checkedCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#6D28D9', justifyContent: 'center', alignItems: 'center' },
  navButtonsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 16, backgroundColor: '#FFF' },
  prevButton: { flex: 1, backgroundColor: '#EDE9FE', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  prevButtonText: { color: '#6D28D9', fontSize: 16, fontWeight: 'bold' },
  nextButton: { flex: 1, backgroundColor: '#4C1D95', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  nextButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  bottomBarItem: { alignItems: 'center', gap: 4 },
  bottomBarText: { fontSize: 10, color: '#6B7280', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  calculatorCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, width: '90%' },
  calcDisplay: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 20, alignItems: 'flex-end', marginBottom: 20 },
  calcDisplayText: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  calcBtn: { width: '22%', aspectRatio: 1, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  calcBtnPurple: { backgroundColor: '#4C1D95' },
  calcBtnText: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  calcBtnTextWhite: { color: '#FFF' },
  paletteCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, width: '100%', maxHeight: '80%' },
  paletteLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '45%' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, color: '#4B5563' },
  paletteScroll: { flexGrow: 0 },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  paletteBtn: { width: 35, height: 35, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  paletteBtnDefault: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  paletteBtnAnswered: { backgroundColor: '#4C1D95' },
  paletteBtnCurrent: { backgroundColor: '#F59E0B' },
  paletteBtnMarked: { backgroundColor: '#EF4444' },
  paletteBtnText: { fontSize: 14, fontWeight: '600' },
  paletteBtnTextDefault: { color: '#111827' },
  paletteBtnTextAnswered: { color: '#FFF' },
  paletteFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 20 },
  exitCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
  exitHeader: { width: '100%', alignItems: 'center', marginBottom: 16 },
  exitIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  closeExitBtn: { position: 'absolute', right: 0, top: 0, padding: 4 },
  exitTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  exitSubtitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 },
  exitDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  warningBox: { flexDirection: 'row', backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, gap: 12, marginBottom: 24 },
  warningText: { flex: 1, fontSize: 13, color: '#991B1B', lineHeight: 18 },
  exitActions: { flexDirection: 'row', gap: 16, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  exitBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#EF4444', alignItems: 'center' },
  exitBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' }
});
