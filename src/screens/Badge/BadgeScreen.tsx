import type { RegistrationDetails } from '../../types/registration';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppImage, AppText } from '../../components';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const memberTypes = [
  'Faculty',
  'Delegate',
  'Accompanying',
  'Event Manager',
  'Exhibitor',
  'Past President',
  'DOS Staff',
  'Without Food',
  'Senior Citizen',
] as const;
type MemberType = (typeof memberTypes)[number];
// Expected badge shape after mapping your API response.
export type Badge = {
  id: string;
  memberType: MemberType;
  regNo: string;
  name: string;
  email: string;
  printed: boolean;
  qr: string;
  qrImageUrl?: string;
  qrImage?: ImageSourcePropType;
  registrationDetails?: RegistrationDetails;
};

// Display-only records. API-loaded data replaces these completely.
const demoBadges: Badge[] = [
  {
    id: 'demo-1',
    memberType: 'Faculty',
    name: 'Dr. Asha Mehta',
    regNo: 'DEMO-REG-001',
    email: 'attendee1@example.com',
    printed: true,
    qr: 'DEMO-BDG-001',
    qrImage: require('../../../assets/badges/demo-001.png'),
  },
  {
    id: 'demo-2',
    memberType: 'Delegate',
    name: 'Aarav Sharma',
    regNo: 'DEMO-REG-002',
    email: 'attendee2@example.com',
    printed: false,
    qr: 'DEMO-BDG-002',
    qrImage: require('../../../assets/badges/demo-002.png'),
  },
  {
    id: 'demo-3',
    memberType: 'Accompanying',
    name: 'Riya Kapoor',
    regNo: 'DEMO-REG-003',
    email: 'attendee3@example.com',
    printed: false,
    qr: 'DEMO-BDG-003',
    qrImage: require('../../../assets/badges/demo-003.png'),
  },
  {
    id: 'demo-4',
    memberType: 'Event Manager',
    name: 'Vikram Shah',
    regNo: 'DEMO-REG-004',
    email: 'attendee4@example.com',
    printed: true,
    qr: 'DEMO-BDG-004',
    qrImage: require('../../../assets/badges/demo-004.png'),
  },
  {
    id: 'demo-5',
    memberType: 'Exhibitor',
    name: 'Neha Verma',
    regNo: 'DEMO-REG-005',
    email: 'attendee5@example.com',
    printed: false,
    qr: 'DEMO-BDG-005',
    qrImage: require('../../../assets/badges/demo-005.png'),
  },
  {
    id: 'demo-6',
    memberType: 'Past President',
    name: 'Dr. Rohan Sen',
    regNo: 'DEMO-REG-006',
    email: 'attendee6@example.com',
    printed: false,
    qr: 'DEMO-BDG-006',
    qrImage: require('../../../assets/badges/demo-006.png'),
  },
  {
    id: 'demo-7',
    memberType: 'DOS Staff',
    name: 'Karan Patel',
    regNo: 'DEMO-REG-007',
    email: 'attendee7@example.com',
    printed: true,
    qr: 'DEMO-BDG-007',
    qrImage: require('../../../assets/badges/demo-007.png'),
  },
  {
    id: 'demo-8',
    memberType: 'Without Food',
    name: 'Priya Rao',
    regNo: 'DEMO-REG-008',
    email: 'attendee8@example.com',
    printed: false,
    qr: 'DEMO-BDG-008',
    qrImage: require('../../../assets/badges/demo-008.png'),
  },
  {
    id: 'demo-9',
    memberType: 'Senior Citizen',
    name: 'Dr. Anita Sethi',
    regNo: 'DEMO-REG-009',
    email: 'attendee9@example.com',
    printed: false,
    qr: 'DEMO-BDG-009',
    qrImage: require('../../../assets/badges/demo-009.png'),
  },
];

type Props = {
  loadBadges?: () => Promise<Badge[]>;
  onEditBadge?: (badge: Badge) => void;
};

export default function BadgeScreen({ loadBadges, onEditBadge }: Props = {}) {
  const [badgeData, setBadgeData] = useState<Badge[]>(
    loadBadges ? [] : demoBadges,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchBadgeData() {
      if (!loadBadges) {
        setBadgeData(demoBadges);
        return;
      }
      setBadgeData([]);
      setIsLoading(true);
      setLoadError(false);
      try {
        const response = await loadBadges();
        if (!Array.isArray(response)) {
          throw new Error('Invalid badge response');
        }
        // Set the mapped API array here. FlatList reads badgeData below.
        if (mounted) {
          setBadgeData(response);
        }
      } catch {
        if (mounted) {
          setLoadError(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    fetchBadgeData();
    return () => {
      mounted = false;
    };
  }, [loadBadges, reloadKey]);

  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [memberType, setMemberType] = useState<MemberType | 'All members'>(
    'All members',
  );
  const [typePicker, setTypePicker] = useState(false);
  const [preview, setPreview] = useState<Badge | null>(null);
  const results = useMemo(
    () =>
      badgeData.filter(
        badge =>
          (memberType === 'All members' || badge.memberType === memberType) &&
          (!search ||
            badge.name.toLowerCase().includes(search) ||
            badge.regNo.toLowerCase().includes(search)),
      ),
    [badgeData, search, memberType],
  );
  function applySearch() {
    setSearch(query.trim().toLowerCase());
    Keyboard.dismiss();
  }
  function clearFilters() {
    setQuery('');
    setSearch('');
    setMemberType('All members');
  }

  const renderBadgeItem = ({ item }: ListRenderItemInfo<Badge>) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.memberPill}>
          <AppText style={styles.memberPillText}>{item.memberType}</AppText>
        </View>
        {onEditBadge && (
          <AppButton
            title="Edit"
            accessibilityLabel={`Edit attendee ${item.regNo}`}
            onPress={() => onEditBadge(item)}
            style={styles.editAttendeeButton}
          />
        )}
      </View>
      <AppText style={styles.name}>{item.name}</AppText>

      <View style={styles.detailRow}>
        <AppText style={styles.detailLabel}>Reg. no.</AppText>
        <AppText selectable style={styles.detailValue}>
          {item.regNo}
        </AppText>
      </View>
      <View style={styles.detailRow}>
        <AppText style={styles.detailLabel}>Email</AppText>
        <AppText selectable style={styles.email}>
          {item.email}
        </AppText>
      </View>
      <View style={styles.detailRow}>
        <AppText style={styles.detailLabel}>Badge printed</AppText>
        <View
          style={[
            styles.status,
            item.printed ? styles.printed : styles.pending,
          ]}
        >
          <AppText style={styles.statusText}>
            {item.printed ? '✓ Yes' : 'Not yet'}
          </AppText>
        </View>
      </View>
      <View style={styles.qrRow}>
        {item.qrImageUrl || item.qrImage ? (
          <AppImage
            source={item.qrImageUrl ? { uri: item.qrImageUrl } : item.qrImage!}
            resizeMode="contain"
            accessibilityLabel={`QR for ${item.regNo}`}
            style={styles.qrThumb}
          />
        ) : (
          <View style={styles.qrThumb}>
            <AppText style={styles.qrArrow}>▣</AppText>
          </View>
        )}

        <View style={styles.qrCopy}>
          <AppText style={styles.qrLabel}>QR CODE NO.</AppText>
          <AppText selectable style={styles.qrValue}>
            {item.qr}
          </AppText>
        </View>
        <AppText style={styles.qrArrow}>↗</AppText>
      </View>
      <AppButton
        variant="primary"
        accessibilityLabel={`Preview badge ${item.regNo}`}
        onPress={() => {
          Keyboard.dismiss();
          setPreview(item);
        }}
        style={styles.printButton}
      >
        <AppText style={styles.printButtonText}>
          {item.printed ? 'Preview / reprint badge' : 'Preview & print badge'}
        </AppText>
        <AppText style={styles.printArrow}>→</AppText>
      </AppButton>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        testID="badge-results"
        data={results}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.topRow}>
              <AppText style={styles.eyebrow}>THE BADGE DESK</AppText>
            </View>
            <AppText style={styles.heading}>
              Search. Badge.{'\n'}
              <AppText style={styles.headingAccent}>Ready to go.</AppText>
            </AppText>
            <AppText style={styles.subtitle}>
              Find your attendees. Get their badges ready.
            </AppText>
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <AppText style={styles.heroLabel}>TOTAL BADGES</AppText>
                <AppText style={styles.heroCount}>
                  {String(badgeData.length).padStart(2, '0')}
                  <AppText style={styles.heroCountNote}>
                    {' '}
                    / {memberTypes.length} member types
                  </AppText>
                </AppText>
              </View>
              <View style={styles.heroIcon}>
                <AppText style={styles.heroIconText}>▣</AppText>
              </View>
            </View>
            <AppText style={styles.sectionTitle}>Search badge & print</AppText>

            <View style={styles.searchRow}>
              <TextInput
                accessibilityLabel="Search badge by name or registration number"
                placeholder="Name or registration no."
                placeholderTextColor={colors.placeholder}
                value={query}
                onChangeText={value => {
                  setQuery(value);
                  if (!value.trim()) {
                    setSearch('');
                  }
                }}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={applySearch}
                style={styles.searchInput}
              />
              <AppButton
                variant="primary"
                title="Search"
                accessibilityLabel="Search badges"
                onPress={applySearch}
                style={styles.searchButton}
              />
            </View>
            <AppText style={styles.fieldLabel}>Member type</AppText>
            <AppButton
              accessibilityLabel="Choose member type"
              accessibilityHint="Filter badges by member type"
              onPress={() => {
                Keyboard.dismiss();
                setTypePicker(true);
              }}
              style={styles.typeSelect}
            >
              <AppText style={styles.typeText}>{memberType}</AppText>
              <AppText style={styles.typeArrow}>⌄</AppText>
            </AppButton>
            <View style={styles.resultsRow}>
              <AppText
                accessibilityLiveRegion="polite"
                style={styles.resultsCount}
              >
                {results.length} {results.length === 1 ? 'badge' : 'badges'}{' '}
                found
              </AppText>
              {(!!query || !!search || memberType !== 'All members') && (
                <AppButton
                  accessibilityLabel="Clear badge filters"
                  onPress={clearFilters}
                  style={styles.clearButton}
                >
                  <AppText style={styles.clearText}>Reset filters</AppText>
                </AppButton>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText style={styles.emptyIcon}>◎</AppText>
            <AppText style={styles.emptyTitle}>
              {isLoading
                ? 'Loading badges…'
                : loadError
                ? 'Unable to load badges'
                : 'No badges found'}
            </AppText>
            <AppText style={styles.emptyText}>
              {loadError
                ? 'Please try again.'
                : badgeData.length
                ? 'Try a different name, registration number or member type.'
                : 'Badge records will appear here when available.'}
            </AppText>
            <AppButton
              title={loadError ? 'Retry' : 'Reset filters'}
              variant="secondary"
              disabled={isLoading}
              onPress={
                loadError
                  ? () => setReloadKey(value => value + 1)
                  : clearFilters
              }
              style={styles.emptyReset}
            />
          </View>
        }
        renderItem={renderBadgeItem}
      />
      <Modal
        transparent
        visible={typePicker}
        animationType="fade"
        onRequestClose={() => setTypePicker(false)}
      >
        <View style={styles.overlay}>
          <AppButton
            accessibilityLabel="Close member type filter"
            onPress={() => setTypePicker(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.pickerCard} accessibilityViewIsModal>
            <View style={styles.modalHeading}>
              <AppText accessibilityRole="header" style={styles.modalTitle}>
                Member type
              </AppText>
              <AppButton
                accessibilityLabel="Close type picker"
                onPress={() => setTypePicker(false)}
                style={styles.closeButton}
              >
                <AppText style={styles.closeText}>×</AppText>
              </AppButton>
            </View>
            <FlatList
              data={['All members', ...memberTypes] as const}
              keyExtractor={item => item}
              renderItem={({ item: type }) => (
                <AppButton
                  accessibilityRole="radio"
                  accessibilityState={{ checked: memberType === type }}
                  accessibilityLabel={type}
                  onPress={() => {
                    setMemberType(type);
                    setTypePicker(false);
                  }}
                  style={[
                    styles.typeOption,
                    memberType === type && styles.selectedOption,
                  ]}
                >
                  <AppText style={styles.optionText}>{type}</AppText>
                  <AppText style={styles.radio}>
                    {memberType === type ? '●' : '○'}
                  </AppText>
                </AppButton>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={!!preview}
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.printModal} accessibilityViewIsModal>
            <View style={styles.modalHeading}>
              <AppText accessibilityRole="header" style={styles.modalTitle}>
                Badge preview
              </AppText>
              <AppButton
                accessibilityLabel="Close badge preview"
                onPress={() => setPreview(null)}
                style={styles.closeButton}
              >
                <AppText style={styles.closeText}>×</AppText>
              </AppButton>
            </View>
            <FlatList
              data={preview ? [preview] : []}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.previewContent}
              renderItem={({ item }) => (
                <View style={styles.badgePaper}>
                  <View style={styles.badgeStrip}>
                    <AppText style={styles.badgeBrand}>RegOK.</AppText>
                    {/* <AppText style={styles.badgeDemo}>
                      {isDemo ? 'SAMPLE BADGE' : 'EVENT BADGE'}
                    </AppText> */}
                  </View>
                  <View style={styles.badgeBody}>
                    <AppText style={styles.badgeMember}>
                      {item.memberType.toUpperCase()}
                    </AppText>
                    <AppText style={styles.badgeName}>{item.name}</AppText>
                    <AppText style={styles.badgeReg}>{item.regNo}</AppText>
                    <AppText style={styles.badgeEmail}>{item.email}</AppText>
                    {item.qrImageUrl || item.qrImage ? (
                      <AppImage
                        source={
                          item.qrImageUrl
                            ? { uri: item.qrImageUrl }
                            : item.qrImage!
                        }
                        resizeMode="contain"
                        accessibilityLabel="Badge QR code"
                        style={styles.qrPreview}
                      />
                    ) : (
                      <AppText style={styles.printerNote}>
                        QR image not available
                      </AppText>
                    )}

                    <AppText style={styles.badgeQr}>{item.qr}</AppText>
                  </View>
                </View>
              )}
              ListFooterComponent={
                <View>
                  <AppText style={styles.printerNote}>
                    Design preview only. Connect a printer to enable printing.
                    No badge has been printed.
                  </AppText>
                  <AppButton
                    title="Print badge"
                    variant="primary"
                    disabled
                    accessibilityLabel="Print badge, printer not connected"
                    style={styles.finalPrint}
                  />
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  editAttendeeButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 24,
    paddingBottom: 32,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  eyebrow: {
    fontSize: typography.size.s9,
    letterSpacing: 1.6,
    fontWeight: typography.weight.bold,
    color: colors.eyebrow,
  },
  previewPill: {
    backgroundColor: colors.selectedTab,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  previewPillText: {
    fontSize: typography.size.s7,
    color: colors.headingGreen,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.7,
  },
  heading: {
    fontSize: typography.size.s34,
    lineHeight: typography.lineHeight.l40,
    letterSpacing: -1,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    marginTop: 20,
  },
  headingAccent: { color: colors.headingGreen },
  subtitle: {
    color: colors.muted,
    fontSize: typography.size.s13,
    lineHeight: typography.lineHeight.l21,
    marginTop: 12,
  },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: 23,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 28,
  },
  heroCopy: { flex: 1 },
  heroLabel: {
    color: colors.primary,
    fontSize: typography.size.s8,
    letterSpacing: 1.5,
    fontWeight: typography.weight.bold,
  },
  heroCount: {
    color: colors.white,
    fontSize: typography.size.s38,
    fontWeight: typography.weight.semibold,
    marginTop: 9,
  },
  heroCountNote: {
    fontSize: typography.size.s11,
    fontWeight: typography.weight.regular,
    color: colors.bannerMuted,
  },
  heroNote: {
    color: colors.bannerMuted,
    fontSize: typography.size.s9,
    lineHeight: typography.lineHeight.l16,
    marginTop: 10,
  },
  heroIcon: {
    height: 56,
    width: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { fontSize: typography.size.s34, color: colors.ink },
  sectionTitle: {
    fontSize: typography.size.s20,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.size.s13,
    color: colors.ink,
  },
  searchButton: { paddingHorizontal: 16, minHeight: 54 },
  fieldLabel: {
    fontSize: typography.size.s11,
    color: colors.muted,
    fontWeight: typography.weight.semibold,
    marginBottom: 8,
  },
  typeSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 16,
    minHeight: 52,
    backgroundColor: colors.white,
  },
  typeText: {
    color: colors.ink,
    fontSize: typography.size.s13,
    fontWeight: typography.weight.medium,
  },
  typeArrow: { color: colors.headingGreen, fontSize: typography.size.s23 },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 62,
  },
  resultsCount: { color: colors.muted, fontSize: typography.size.s12 },
  clearButton: { minHeight: 44, justifyContent: 'center' },
  clearText: {
    color: colors.headingGreen,
    fontSize: typography.size.s12,
    fontWeight: typography.weight.semibold,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  memberPill: {
    backgroundColor: colors.selectedTab,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  memberPillText: {
    fontSize: typography.size.s10,
    color: colors.headingGreen,
    fontWeight: typography.weight.bold,
  },
  sampleLabel: {
    fontSize: typography.size.s8,
    letterSpacing: 1.5,
    color: colors.muted,
  },
  name: {
    fontSize: typography.size.s20,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    marginTop: 18,
    marginBottom: 17,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  detailLabel: { color: colors.muted, fontSize: typography.size.s11 },
  detailValue: {
    color: colors.ink,
    fontSize: typography.size.s12,
    fontWeight: typography.weight.semibold,
    flexShrink: 1,
    textAlign: 'right',
  },
  email: {
    color: colors.ink,
    fontSize: typography.size.s12,
    flex: 1,
    textAlign: 'right',
  },
  status: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  printed: { backgroundColor: colors.successBackground },
  pending: { backgroundColor: colors.lunchBackground },
  statusText: {
    color: colors.ink,
    fontSize: typography.size.s10,
    fontWeight: typography.weight.semibold,
  },
  qrRow: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    marginBottom: 16,
  },
  qrThumb: {
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 5,
  },
  qrCopy: { flex: 1 },
  qrLabel: {
    color: colors.muted,
    fontSize: typography.size.s7,
    letterSpacing: 1.1,
    fontWeight: typography.weight.bold,
  },
  qrValue: {
    color: colors.ink,
    fontSize: typography.size.s12,
    fontWeight: typography.weight.semibold,
    marginTop: 5,
  },
  qrArrow: { color: colors.headingGreen, fontSize: typography.size.s23 },
  printButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  printButtonText: {
    color: colors.buttonText,
    fontSize: typography.size.s13,
    fontWeight: typography.weight.bold,
    flexShrink: 1,
  },
  printArrow: { fontSize: typography.size.s24, color: colors.buttonText },
  empty: {
    padding: 28,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  emptyIcon: { color: colors.emptyIcon, fontSize: typography.size.s40 },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.size.s18,
    fontWeight: typography.weight.semibold,
    marginTop: 12,
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.size.s12,
    lineHeight: typography.lineHeight.l20,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyReset: { marginTop: 20 },
  overlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pickerCard: {
    maxHeight: '85%',
    maxWidth: 440,
    width: '100%',
    padding: 20,
    borderRadius: 25,
    backgroundColor: colors.white,
  },
  modalHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: typography.size.s23,
    color: colors.ink,
    fontWeight: typography.weight.bold,
    flex: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: typography.size.s27, color: colors.ink },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 3,
  },
  selectedOption: { backgroundColor: colors.selectedTab },
  optionText: { fontSize: typography.size.s14, color: colors.ink },
  radio: { color: colors.headingGreen, fontSize: typography.size.s20 },
  printModal: {
    maxHeight: '90%',
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.white,
    borderRadius: 25,
    padding: 20,
  },
  previewContent: { paddingBottom: 8 },
  badgePaper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  badgeStrip: {
    backgroundColor: colors.ink,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeBrand: {
    color: colors.primary,
    fontSize: typography.size.s20,
    fontWeight: typography.weight.extraBold,
  },
  badgeDemo: {
    color: colors.bannerMuted,
    fontSize: typography.size.s7,
    letterSpacing: 1.2,
  },
  badgeBody: { alignItems: 'center', padding: 24 },
  badgeMember: {
    color: colors.headingGreen,
    fontSize: typography.size.s9,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  badgeName: {
    color: colors.ink,
    fontSize: typography.size.s23,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginTop: 18,
  },
  badgeReg: {
    color: colors.ink,
    fontSize: typography.size.s13,
    fontWeight: typography.weight.semibold,
    marginTop: 12,
  },
  badgeEmail: {
    color: colors.muted,
    fontSize: typography.size.s11,
    textAlign: 'center',
    marginTop: 7,
  },
  qrPreview: { width: 150, height: 150, marginTop: 22 },
  badgeQr: { color: colors.ink, fontSize: typography.size.s12, marginTop: 8 },
  printerNote: {
    fontSize: typography.size.s11,
    lineHeight: typography.lineHeight.l19,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  finalPrint: { width: '100%' },
});
