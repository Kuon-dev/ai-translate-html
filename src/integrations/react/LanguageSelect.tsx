/** @jsxImportSource react */
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "~/integrations/shadcn/ui/select";

interface SelectProps {
  options: { label: string; value: string }[];
  placeholder: string;
  label: string;
  onChange: (value: string) => void;
}

export default function CustomSelect({
  options,
  placeholder,
  label,
  onChange,
}: SelectProps) {
  const handleSelectChange = (value: string) => {
    onChange(value);
  };

  return (
    <Select onValueChange={handleSelectChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export const languages = [
  // { label: 'English', value: 'english (en)' },
  { label: 'Chinese (Simplified)', value: 'chinese (zh)' },
  { label: 'Chinese (Traditional)', value: 'chinese traditional (zh-TW)' },
  { label: 'Vietnamese', value: 'vietnam (vi)' },
  { label: 'Thai', value: 'thai (th)' },
  { label: 'Malay', value: 'malay (bm)' },
];
