export type ServiceId = 'kit' | 'dinner' | 'lunch';
export type ScanRecord = {
  id: string;
  service: ServiceId;
  time: string;
  value: string;
  scannedAt?: string;
  name?: string;
  email?: string;
  registrationNo?: string;
  qrCodeNo?: string;
};

export type ScanFeedback = {
  status: 'success' | 'duplicate' | 'error';
  title: string;
  message: string;
};
