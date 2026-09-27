/**
 * Fields derived from a profile and stored beside it, recomputed on every
 * profile update. They are private: the card shows only the nạp âm element
 * and the day master, never the can chi or the full day pillar.
 */
import { dayPillarOf } from './bazi'
import type { Branch, Stem } from './lunar'
import { regionForCity } from './privacy'
import { tuoiOf } from './tuoi'
import type { Element, Region } from './types'

export interface DerivedProfile {
  region: Region | null
  lunarYear: number | null
  yearStem: Stem | null
  yearBranch: Branch | null
  napAm: string | null
  napAmElement: Element | null
  dayStem: Stem | null
  dayBranch: Branch | null
  dayElement: Element | null
}

export function deriveProfile(p: { birthDate?: string | null; birthTime?: string | null; city?: string | null }): DerivedProfile {
  const region = regionForCity(p.city)
  if (!p.birthDate) {
    return {
      region, lunarYear: null, yearStem: null, yearBranch: null, napAm: null, napAmElement: null,
      dayStem: null, dayBranch: null, dayElement: null,
    }
  }
  const tuoi = tuoiOf(p.birthDate)
  const day = dayPillarOf(p.birthDate, p.birthTime)
  return {
    region,
    lunarYear: tuoi.lunarYear,
    yearStem: tuoi.stem,
    yearBranch: tuoi.branch,
    napAm: tuoi.napAm.name,
    napAmElement: tuoi.napAm.element,
    dayStem: day.stem,
    dayBranch: day.branch,
    dayElement: day.element,
  }
}
