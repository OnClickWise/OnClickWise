'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Lista de moedas suportadas (ISO 4217). Foco em mercados onde o sistema é usado.
 * Adicione novas moedas aqui se necessário — ordem reflete prioridade.
 */
export const SUPPORTED_CURRENCIES = [
  // PT/Lusófono (foco Primavera)
  { code: 'AOA', name: 'Kwanza Angolano', region: 'Lusófono' },
  { code: 'BRL', name: 'Real Brasileiro', region: 'Lusófono' },
  { code: 'EUR', name: 'Euro', region: 'Lusófono' },
  { code: 'MZN', name: 'Metical Moçambicano', region: 'Lusófono' },
  { code: 'CVE', name: 'Escudo Cabo-verdiano', region: 'Lusófono' },
  // Internacionais
  { code: 'USD', name: 'Dólar Americano', region: 'Internacional' },
  { code: 'GBP', name: 'Libra Esterlina', region: 'Internacional' },
  { code: 'CHF', name: 'Franco Suíço', region: 'Internacional' },
  { code: 'JPY', name: 'Iene Japonês', region: 'Internacional' },
  { code: 'CNY', name: 'Yuan Chinês', region: 'Internacional' },
  // Latam
  { code: 'ARS', name: 'Peso Argentino', region: 'América Latina' },
  { code: 'CLP', name: 'Peso Chileno', region: 'América Latina' },
  { code: 'MXN', name: 'Peso Mexicano', region: 'América Latina' },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function CurrencySelect({ value, onChange, disabled }: Props) {
  // Agrupa por região mantendo ordem
  const groups = SUPPORTED_CURRENCIES.reduce<Record<string, typeof SUPPORTED_CURRENCIES[number][]>>(
    (acc, c) => {
      if (!acc[c.region]) acc[c.region] = [];
      acc[c.region].push(c);
      return acc;
    },
    {},
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecionar moeda..." />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groups).map(([region, list]) => (
          <SelectGroup key={region}>
            <SelectLabel>{region}</SelectLabel>
            {list.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="font-mono text-xs mr-2">{c.code}</span>
                {c.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
