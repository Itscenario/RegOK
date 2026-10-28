export type RegistrationDetails = {
  id: string;
  name: string;
  food: string;
  foodOptions: { label: string; value: string }[];
  entitlements: {
    id: string;
    label: string;
    date?: string;
    enabled: boolean | null;
  }[];
};
