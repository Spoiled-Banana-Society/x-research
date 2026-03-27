export const week = (() => {
  const _date = new Date()

  const nflStartDate = new Date('2025-09-02T12:00:00')
  if (_date < nflStartDate) return 1
  const m = Math.round((_date-nflStartDate)/(1000*60*60*24)) / 7

  let _week = Math.floor(m) + 1
  // Set to super bowl week if we progressed past that week
  if (_week > 17) {
    _week = 17
  }
  return _week
})()
// export const week = 13

export const SEASON = 2025

export const weekOptions = Array.from({length: week}, (_, i) => i + 1)
export const allWeeks = Array.from({length: 17}, (_, i) => i + 1)