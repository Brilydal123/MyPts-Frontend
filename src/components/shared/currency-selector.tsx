import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const currencies = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'XAF', label: 'XAF (FCFA)', symbol: 'FCFA' },
  { value: 'NGN', label: 'NGN (₦)', symbol: '₦' },
  { value: 'PKR', label: 'PKR (₨)', symbol: '₨' },
];

export function CurrencySelector({ value, onChange, className }: CurrencySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.value} value={currency.value}>
            {currency.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getCurrencySymbol(currencyCode: string): string {
  const currency = currencies.find((c) => c.value === currencyCode);
  return currency ? currency.symbol : '$';
}
