import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { PRESET_MATERIALS, presetUrl, type PresetMaterial } from '@/lib/presets';

export function SampleMaterialsMenu({
  onLoad,
  materials = PRESET_MATERIALS,
}: {
  onLoad: (url: string) => void;
  materials?: PresetMaterial[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Sample materials
          <ChevronRight />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {materials.map((preset) => (
          <DropdownMenuItem key={presetUrl(preset)} onSelect={() => onLoad(presetUrl(preset, window.location.origin))}>
            <span className="capitalize">{preset.name.replaceAll('_', ' ')}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
