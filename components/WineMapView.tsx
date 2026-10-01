'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { MapGroup } from '@/lib/wine-map';
import 'leaflet/dist/leaflet.css';

interface Props { groups: MapGroup[]; isPT: boolean; selected: string | null; onSelect: (key: string) => void }

function MapViewport({ groups, selected }: Pick<Props, 'groups' | 'selected'>) {
  const map = useMap();
  useEffect(() => {
    if (groups.length) map.fitBounds(L.latLngBounds(groups.map(g => [g.lat, g.lng])), { padding: [35, 35], maxZoom: 7, animate: false });
    else map.setView([25, 10], 2, { animate: false });
  }, [groups, map]);
  useEffect(() => {
    const group = groups.find(g => g.key === selected);
    if (group) map.setView([group.lat, group.lng], Math.max(map.getZoom(), 6), { animate: false });
  }, [selected, groups, map]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function WineMapView({ groups, isPT, selected, onSelect }: Props) {
  const [tileError, setTileError] = useState(false);
  const [tileRevision, setTileRevision] = useState(0);
  return <>
    <MapContainer center={[25, 10]} zoom={2} minZoom={0} scrollWheelZoom={false} className="wine-atlas-map" aria-label={isPT ? 'Origens dos vinhos' : 'Wine origins'}>
      <TileLayer key={tileRevision}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{ tileerror: () => setTileError(true) }} />
      <MapViewport groups={groups} selected={selected} />
      {groups.map(group => {
        const stocked = group.entries.some(e => e.wine.status === 'in_cellar');
        const journal = group.entries.some(e => e.wine.status === 'consumed');
        const kind = stocked && journal ? 'mixed' : stocked ? 'cellar' : 'journal';
        const countryOnly = group.entries.every(e => e.origin?.precision === 'country');
        const names = Array.from(new Set(group.entries.map(e => e.origin?.label))).join(' · ');
        const label = `${names}: ${group.entries.length} ${isPT ? 'registros' : 'wine records'}${countryOnly ? (isPT ? ' · país aproximado' : ' · country approximation') : ''}`;
        return <Marker key={`${group.key}:${kind}:${group.entries.length}:${isPT}`} position={[group.lat, group.lng]} title={label} alt={label}
          icon={L.divIcon({ className: 'wine-atlas-marker', html: `<span class="atlas-pin atlas-pin-${kind}${countryOnly ? ' atlas-pin-approximate' : ''}${selected === group.key ? ' atlas-pin-selected' : ''}">${group.entries.length}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] })}
          eventHandlers={{ click: () => onSelect(group.key) }}>
          <Popup minWidth={180} maxWidth={260}><div className="atlas-popup"><strong>{names}</strong><p>{group.entries.length} {isPT ? 'registros de vinho' : 'wine records'}</p><p>{countryOnly ? (isPT ? 'Só o país foi localizado.' : 'Only the country could be located.') : (isPT ? 'Ponto regional aproximado, não a vinícola.' : 'Approximate regional point, not the winery.')}</p><p>{isPT ? 'Veja os vinhos na lista abaixo do mapa.' : 'See these wines in the list below the map.'}</p></div></Popup>
        </Marker>;
      })}
    </MapContainer>
    {tileError && <div className="atlas-tile-error" role="status"><span>{isPT ? 'O mapa-base não carregou completamente. A lista de vinhos continua disponível.' : 'The base map did not load completely. Your wine list is still available.'}</span><button onClick={() => { setTileError(false); setTileRevision(n => n + 1); }}>{isPT ? 'Recarregar mapa' : 'Reload map'}</button></div>}
  </>;
}
