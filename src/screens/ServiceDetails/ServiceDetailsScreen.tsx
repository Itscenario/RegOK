import { readQrPayload, qrField } from '../../utils/qrPayload';
import type { ScanRecord } from '../../types/services';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, AppButton } from '../../components';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { ScreenProps } from '../../navigation/types';

const titles = { kit: 'Kit', dinner: 'Dinner', lunch: 'Lunch' };

export function getScanFields(record: ScanRecord) {
  const payload = readQrPayload(record.value);
  function field(direct: string | undefined, ...keys: string[]) {
    return direct?.trim() || qrField(payload, ...keys) || 'Not available';
  }
  const combinedName = [
    qrField(payload, 'firstName', 'givenName'),
    qrField(payload, 'lastName', 'surname', 'familyName'),
  ]
    .filter(Boolean)
    .join(' ');
  const date = record.scannedAt ? new Date(record.scannedAt) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
  const qr = field(
    record.qrCodeNo,
    'qrCodeNo',
    'qr_code_no',
    'qrCode',
    'qr_code',
    'qrNo',
  );
  return [
    {
      label: 'Name',
      value:
        record.name?.trim() ||
        qrField(
          payload,
          'name',
          'fullName',
          'attendeeName',
          'participantName',
          'delegateName',
          'displayName',
          'fn',
        ) ||
        combinedName ||
        'Not available',
    },
    {
      label: 'Email',
      value: field(record.email, 'email', 'emailAddress', 'email_address'),
    },
    {
      label: 'Registration No.',
      value: field(
        record.registrationNo,
        'registrationNo',
        'registration_no',
        'registrationNumber',
        'regNo',
        'reg_no',
      ),
    },
    {
      label: 'QR Code No.',
      value:
        qr !== 'Not available'
          ? qr
          : Object.keys(payload).length === 0
          ? record.value
          : 'Not available',
    },
    {
      label: 'Date',
      value: validDate
        ? validDate.toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'Not available',
    },
    {
      label: 'Time',
      value: validDate
        ? validDate.toLocaleTimeString()
        : record.time || 'Not available',
    },
  ];
}

export type ServiceDetailsItem = ScanRecord & {
  name: string;
  email: string;
  registrationNo: string;
  qrCodeNo: string;
  date: string;
};

// Map the QR/API fields once so renderItem can use item.name, item.email, etc.
export function toServiceDetailsItem(record: ScanRecord): ServiceDetailsItem {
  const fields = getScanFields(record);
  return {
    ...record,
    name: fields[0].value,
    email: fields[1].value,
    registrationNo: fields[2].value,
    qrCodeNo: fields[3].value,
    date: fields[4].value,
    time: fields[5].value,
  };
}

export default function ServiceDetailsScreen({
  route,
}: ScreenProps<'ServiceDetails'>) {
  const { serviceId, records } = route.params;
  const title = titles[serviceId];
  const [serviceData, setServiceData] = useState<ServiceDetailsItem[]>(() =>
    records.map(toServiceDetailsItem),
  );
  useEffect(() => {
    // When API/route records change, update the FlatList data here.
    setServiceData(records.map(toServiceDetailsItem));
  }, [records]);
  const [nameInput, setNameInput] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const entries = useMemo(
    () => serviceData.filter(item => item.service === serviceId),
    [serviceData, serviceId],
  );
  const filteredEntries = useMemo(() => {
    if (!nameFilter) {
      return entries;
    }
    return entries.filter(item => {
      const name = item.name;
      return (
        name !== 'Not available' &&
        name.toLocaleLowerCase().includes(nameFilter)
      );
    });
  }, [entries, nameFilter]);
  function applyFilter() {
    setNameFilter(nameInput.trim().toLocaleLowerCase());
    Keyboard.dismiss();
  }
  function clearFilter() {
    setNameInput('');
    setNameFilter('');
  }

  const renderServiceItem = ({
    item,
  }: ListRenderItemInfo<ServiceDetailsItem>) => (
    <View style={styles.record}>
      <View style={styles.recordHeader}>
        <View style={styles.status}>
          <AppText style={styles.statusText}>SCANNED</AppText>
        </View>
      </View>
      <View style={styles.fields}>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>Name</AppText>
          <AppText selectable style={styles.fieldValue}>
            {item.name}
          </AppText>
        </View>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>Email</AppText>
          <AppText selectable style={styles.fieldValue}>
            {item.email}
          </AppText>
        </View>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>Registration No.</AppText>
          <AppText selectable style={styles.fieldValue}>
            {item.registrationNo}
          </AppText>
        </View>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>QR Code No.</AppText>
          <AppText selectable style={styles.fieldValue}>
            {item.qrCodeNo}
          </AppText>
        </View>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>Date</AppText>
          <AppText selectable style={styles.fieldValue}>
            {item.date}
          </AppText>
        </View>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>Time</AppText>
          <AppText selectable style={styles.fieldValue}>
            {item.time}
          </AppText>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={filteredEntries}
        keyboardShouldPersistTaps="handled"
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <AppText style={styles.eyebrow}>
              {title.toUpperCase()} SERVICE
            </AppText>
            <AppText style={styles.heading}>{title} scan details</AppText>
            <AppText style={styles.subtitle}>
              All scanned QR codes for your assigned service.
            </AppText>
            <View style={styles.summary}>
              <AppText style={styles.total}>
                {String(entries.length).padStart(2, '0')}
              </AppText>
              <View>
                <AppText style={styles.summaryTitle}>Total scans</AppText>
                <AppText style={styles.summaryNote}>
                  {title} collection activity
                </AppText>
              </View>
            </View>
            <AppText style={styles.sectionTitle}>Scan history</AppText>
            <View style={styles.filterRow}>
              <TextInput
                accessibilityLabel="Filter scans by name"
                placeholder="Search by name"
                placeholderTextColor={colors.placeholder}
                value={nameInput}
                onChangeText={value => {
                  setNameInput(value);
                  if (!value.trim()) {
                    setNameFilter('');
                  }
                }}
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={applyFilter}
                style={styles.filterInput}
              />
              <AppButton
                title="Filter"
                variant="primary"
                accessibilityLabel="Apply name filter"
                onPress={applyFilter}
                style={styles.filterButton}
              />
            </View>
            {(!!nameInput || !!nameFilter) && (
              <View style={styles.filterMeta}>
                <AppText
                  accessibilityLiveRegion="polite"
                  style={styles.filterCount}
                >
                  {filteredEntries.length} of {entries.length} scans
                </AppText>
                <AppButton
                  accessibilityLabel="Clear name filter"
                  onPress={clearFilter}
                  style={styles.clearButton}
                >
                  <AppText style={styles.clearText}>Clear</AppText>
                </AppButton>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText style={styles.emptyIcon}>◎</AppText>
            <AppText style={styles.emptyTitle}>
              {nameFilter
                ? 'No matching names'
                : `No ${title.toLowerCase()} scans yet`}
            </AppText>
            <AppText style={styles.emptyText}>
              {nameFilter
                ? 'Try another name or clear the filter to see all scans.'
                : 'Scan a QR code from Home to see its details here.'}
            </AppText>
          </View>
        }
        renderItem={renderServiceItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  filterInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.ink,
    fontSize: typography.size.s14,
  },
  filterButton: { minHeight: 52, paddingHorizontal: 18 },
  filterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterCount: { color: colors.muted, fontSize: typography.size.s12 },
  clearButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: colors.headingGreen,
    fontSize: typography.size.s12,
    fontWeight: typography.weight.semibold,
  },
  fields: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginVertical: 16,
  },
  fieldRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 5,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: typography.size.s11,
    fontWeight: typography.weight.medium,
  },
  fieldValue: {
    color: colors.ink,
    fontSize: typography.size.s14,
    lineHeight: typography.lineHeight.l22,
    fontWeight: typography.weight.semibold,
  },
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 24,
    paddingBottom: 32,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: typography.size.s9,
    letterSpacing: 1.6,
    fontWeight: typography.weight.bold,
    color: colors.eyebrow,
    marginTop: 8,
  },
  heading: {
    fontSize: typography.size.s27,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    marginTop: 12,
  },
  subtitle: {
    fontSize: typography.size.s13,
    lineHeight: typography.lineHeight.l21,
    color: colors.muted,
    marginTop: 10,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: colors.ink,
    padding: 24,
    borderRadius: 24,
    marginVertical: 26,
  },
  total: {
    fontSize: typography.size.s44,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  summaryTitle: {
    fontSize: typography.size.s15,
    color: colors.white,
    fontWeight: typography.weight.semibold,
  },
  summaryNote: {
    fontSize: typography.size.s11,
    color: colors.bannerMuted,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: typography.size.s18,
    color: colors.ink,
    fontWeight: typography.weight.bold,
    marginBottom: 14,
  },
  record: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  recordTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: typography.size.s15,
    fontWeight: typography.weight.semibold,
  },
  status: {
    backgroundColor: colors.successBackground,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },
  statusText: {
    fontSize: typography.size.s8,
    fontWeight: typography.weight.bold,
    color: colors.statusText,
  },
  time: { fontSize: typography.size.s12, color: colors.muted, marginTop: 9 },
  data: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginVertical: 16,
  },
  dataLabel: {
    color: colors.eyebrow,
    fontSize: typography.size.s8,
    fontWeight: typography.weight.bold,
    letterSpacing: 1.2,
  },
  value: {
    color: colors.ink,
    fontSize: typography.size.s14,
    lineHeight: typography.lineHeight.l22,
    marginTop: 9,
  },
  id: { color: colors.muted, fontSize: typography.size.s9 },
  empty: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  emptyIcon: { color: colors.emptyIcon, fontSize: typography.size.s40 },
  emptyTitle: {
    color: colors.ink,
    fontSize: typography.size.s15,
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
});
