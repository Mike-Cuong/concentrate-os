import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clockTime, dayBudget, durationLabel, hasRoutineTiming, shiftDate, startOfWeek, validateRoutine, validateSchedule, weekDates } from './planner.ts'

const today = '2026-10-05'
const routine = { sleepMinutes: 480, sleepStartTime: '23:00', commuteMinutes: 60, commuteStartTime: '07:00', personalMinutes: 120, personalStartTime: '18:00' }
const sleepOnly = { ...routine, commuteMinutes: 0, personalMinutes: 0 }
function workspace(overrides = {}) {
  return { today, routines: { [today]: { ...routine } }, schedule: [], tasks: [], goals: [], sessions: [], preferences: { dailyMinutes: 120, name: 'Test' }, ...overrides }
}
function schedule(startTime, endTime, date = today, id = `${date}-${startTime}-${endTime}`) {
  return { id, title: 'Lịch kiểm thử', date, startTime, endTime, category: 'study' }
}
function assertPartition(budget) {
  assert.ok(budget.freeMinutes >= 0 && budget.freeMinutes <= 1440)
  assert.equal(budget.freeMinutes, budget.freeSlots.reduce((sum, slot) => sum + slot.end - slot.start, 0))
  budget.freeSlots.forEach((slot, index) => {
    assert.ok(slot.start >= 0 && slot.end <= 1440 && slot.end > slot.start)
    if (index) assert.ok(budget.freeSlots[index - 1].end < slot.start)
  })
}

test('duration-only data keeps the old total without inventing clock times', () => {
  const budget = dayBudget(workspace({ routines: {} }), today)
  assert.equal(budget.freeMinutes, 780)
  assert.equal(budget.freeSlots, null)
  assert.equal(hasRoutineTiming(budget.routine), false)
  assert.equal(validateRoutine(budget.routine), null)
})

test('sleep, commute and personal time leave exact daily gaps', () => {
  const budget = dayBudget(workspace(), today)
  assert.deepEqual(budget.freeSlots, [{ start: 480, end: 1080 }, { start: 1200, end: 1380 }])
  assert.equal(budget.freeMinutes, 780)
  assert.equal(budget.usesPreviousDayFallback, true)
  assertPartition(budget)
})

test('timetable and several daily activities update the result', () => {
  const data = workspace({
    routines: { [today]: { ...routine, personalStartTime: '12:00', personalMinutes: 60, extraPeriods: [{ id: 'dinner', category: 'personal', startTime: '18:00', minutes: 60 }] } },
    schedule: [schedule('08:00', '12:00'), schedule('13:00', '17:00')],
  })
  const budget = dayBudget(data, today)
  assert.deepEqual(budget.freeSlots, [{ start: 1020, end: 1080 }, { start: 1140, end: 1380 }])
  assert.equal(budget.freeMinutes, 300)
  assert.equal(budget.routineMinutes.personal, 120)
  data.schedule = data.schedule.filter((entry) => entry.startTime !== '13:00')
  assert.equal(dayBudget(data, today).freeMinutes, 540)
})

test('overlapping, nested, adjacent and duplicate blocks are counted only once', () => {
  const budget = dayBudget(workspace({
    routines: { [today]: { ...routine, personalStartTime: '12:00' } },
    schedule: [schedule('08:00', '12:00'), schedule('10:00', '13:00'), schedule('13:00', '14:00'), schedule('08:00', '12:00', today, 'duplicate')],
  }), today)
  assert.deepEqual(budget.freeSlots, [{ start: 840, end: 1380 }])
  assert.equal(budget.scheduledMinutes, 360)
  assert.equal(budget.overlapMinutes, 360)
  assert.equal(budget.routineOverlapMinutes, 120)
  assert.equal(budget.freeMinutes, 540)
})

test('overnight schedules are clipped at both day boundaries', () => {
  const budget = dayBudget(workspace({
    routines: { [today]: { ...sleepOnly, sleepStartTime: '02:00', sleepMinutes: 360 } },
    schedule: [schedule('22:00', '02:00', shiftDate(today, -1)), schedule('22:30', '01:00')],
  }), today)
  assert.deepEqual(budget.freeSlots, [{ start: 480, end: 1350 }])
  assert.equal(budget.scheduledMinutes, 210)
  assertPartition(budget)
})

test('uses the actual previous night when neighboring routines differ', () => {
  const budget = dayBudget(workspace({ routines: {
    [shiftDate(today, -1)]: { ...sleepOnly, sleepStartTime: '22:00' },
    [today]: { ...sleepOnly, sleepMinutes: 360 },
  } }), today)
  assert.deepEqual(budget.freeSlots, [{ start: 360, end: 1380 }])
  assert.equal(budget.routineMinutes.sleep, 420)
  assert.equal(budget.usesPreviousDayFallback, false)
})

test('extra activities crossing midnight carry into the next day', () => {
  const overnight = { ...sleepOnly, sleepStartTime: '02:00', sleepMinutes: 360, extraPeriods: [{ id: 'late-activity', category: 'personal', startTime: '23:30', minutes: 120 }] }
  const budget = dayBudget(workspace({ routines: { [today]: overnight, [shiftDate(today, -1)]: overnight } }), today)
  assert.deepEqual(budget.freeSlots, [{ start: 90, end: 120 }, { start: 480, end: 1410 }])
  assert.equal(budget.routineMinutes.personal, 120)
  assertPartition(budget)
})

test('a completely occupied day has no free slots', () => {
  const budget = dayBudget(workspace({ schedule: [schedule('08:00', '23:00')] }), today)
  assert.deepEqual(budget.freeSlots, [])
  assert.equal(budget.freeMinutes, 0)
  assert.equal(budget.overbookedMinutes, 0)
})

test('preserves short gaps and the 24:00 boundary', () => {
  const budget = dayBudget(workspace({ routines: { [today]: { ...routine, personalMinutes: 0 } }, schedule: [schedule('08:00', '12:00'), schedule('12:05', '23:00')] }), today)
  assert.deepEqual(budget.freeSlots, [{ start: 720, end: 725 }])
  assert.equal(budget.freeMinutes, 5)
  const daytimeSleep = dayBudget(workspace({ routines: { [today]: { ...sleepOnly, sleepStartTime: '00:00' } } }), today)
  assert.deepEqual(daytimeSleep.freeSlots, [{ start: 480, end: 1440 }])
  assert.equal(clockTime(1440), '24:00')
})

test('completed tasks stay busy while archived-goal tasks are excluded', () => {
  const budget = dayBudget(workspace({
    goals: [{ id: 'active', archived: false }, { id: 'archived', archived: true }],
    tasks: [
      { id: 'done', title: 'Done', goalId: 'active', scheduledDate: today, startTime: '08:00', minutes: 60, completed: true },
      { id: 'hidden', title: 'Hidden', goalId: 'archived', scheduledDate: today, startTime: '09:00', minutes: 60, completed: false },
    ],
  }), today)
  assert.equal(budget.freeSlots[0].start, 540)
  assert.equal(budget.scheduledMinutes, 60)
})

test('week total equals the sum of seven daily gap totals', () => {
  const dates = weekDates(today)
  const data = workspace({ routines: Object.fromEntries(dates.map((date) => [date, { ...routine }])), schedule: dates.slice(0, 5).map((date) => schedule('08:00', '16:00', date)) })
  const days = dates.map((date) => dayBudget(data, date))
  days.forEach(assertPartition)
  assert.equal(days.reduce((sum, day) => sum + day.freeMinutes, 0), 3060)
  assert.equal(durationLabel(3060), '51 giờ')
})

test('Sunday overnight entries carry into Monday of the next week', () => {
  const budget = dayBudget(workspace({ schedule: [schedule('23:00', '09:00', shiftDate(today, -1))] }), today)
  assert.equal(budget.freeSlots[0].start, 540)
  assert.equal(startOfWeek('2027-01-01'), '2026-12-28')
  assert.equal(weekDates('2027-01-01')[6], '2027-01-03')
})

test('validates the 6–8 hour sleep range, times, durations and legacy data', () => {
  for (const sleepMinutes of [360, 390, 420, 450, 480]) assert.equal(validateRoutine({ ...routine, sleepMinutes }), null)
  for (const sleepMinutes of [359, 481, NaN, 420.5]) assert.ok(validateRoutine({ ...routine, sleepMinutes }))
  assert.ok(validateRoutine({ ...routine, sleepStartTime: '24:00' }))
  assert.ok(validateRoutine({ ...routine, commuteStartTime: '' }))
  assert.ok(validateRoutine({ ...routine, commuteMinutes: -1 }))
  assert.ok(validateRoutine({ ...routine, personalMinutes: 1000 }))
  assert.equal(validateRoutine({ sleepMinutes: 480, sleepStartTime: '23:00', commuteMinutes: 0, personalMinutes: 0 }), null)
  for (const minutes of [0, -1, 1.5, NaN, 1441]) assert.ok(validateRoutine({ ...routine, extraPeriods: [{ id: 'x', category: 'personal', startTime: '12:00', minutes }] }))
  assert.ok(validateRoutine({ ...routine, extraPeriods: [{ id: 'x', category: 'invalid', startTime: '12:00', minutes: 30 }] }))
  assert.ok(validateSchedule(schedule('08:00', '08:00')))
  assert.equal(validateSchedule(schedule('23:00', '01:00')), null)
})

test('random overlapping schedules match an independent minute-by-minute oracle', () => {
  let seed = 42
  const random = (max) => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % max }
  for (let sample = 0; sample < 100; sample++) {
    const occupied = Array(1440).fill(false)
    const mark = (start, end) => { for (let minute = Math.max(0, start); minute < Math.min(1440, end); minute++) occupied[minute] = true }
    mark(0, 420); mark(420, 480); mark(1080, 1200); mark(1380, 1440)
    const entries = Array.from({ length: random(20) }, (_, index) => {
      const start = random(1440)
      const duration = random(1439) + 1
      const previous = random(2) === 0
      const offset = previous ? -1440 : 0
      mark(start + offset, start + duration + offset)
      return schedule(clockTime(start), clockTime((start + duration) % 1440), previous ? shiftDate(today, -1) : today, String(index))
    })
    const budget = dayBudget(workspace({ schedule: entries }), today)
    const free = Array(1440).fill(false)
    budget.freeSlots.forEach((slot) => { for (let minute = slot.start; minute < slot.end; minute++) free[minute] = true })
    assert.deepEqual(free, occupied.map((busy) => !busy))
    assertPartition(budget)
  }
})
