'use client';

import { useCellar } from '@/components/CellarSession';
import CellarCollection from '@/components/CellarCollection';
import { useWineInventory } from '@/hooks/useWineInventory';

export default function Home() {
  const { dataSource, cellar } = useCellar();
  const inventory = useWineInventory(dataSource);
  return <CellarCollection {...inventory} locale={cellar.locale} cellarName={cellar.name} />;
}
