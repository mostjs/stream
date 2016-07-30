/** @license MIT License (c) copyright 2016 original author or authors */

import ScheduledTask from './ScheduledTask'
import binarySearch from './binarySearch'
import { findIndex, removeAll } from '@most/prelude'

export default class Scheduler {
  constructor (timer) {
    this.timer = timer

    this._timer = null
    this._nextArrival = 0
    this._tasks = []

    var self = this
    this._runReadyTasksBound = function () {
      self._runReadyTasks(self.now())
    }
  }

  now () {
    return this.timer.now()
  }

  asap (task) {
    return this.schedule(0, -1, task)
  }

  delay (delay, task) {
    return this.schedule(delay, -1, task)
  }

  periodic (period, task) {
    return this.schedule(0, period, task)
  }

  schedule (delay, period, task) {
    var now = this.now()
    var st = new ScheduledTask(now + Math.max(0, delay), period, task, this)

    insertByTime(st, this._tasks)
    this._scheduleNextRun(now)
    return st
  }

  cancel (task) {
    task.active = false
    var i = binarySearch(task.time, this._tasks)

    if (i >= 0 && i < this._tasks.length) {
      var at = findIndex(task, this._tasks[i].events)
      if (at >= 0) {
        this._tasks[i].events.splice(at, 1)
        this._reschedule()
      }
    }
  }

  cancelAll (f) {
    for (var i = 0; i < this._tasks.length; ++i) {
      removeAllFrom(f, this._tasks[i])
    }
    this._reschedule()
  }

  _reschedule () {
    if (this._tasks.length === 0) {
      this._unschedule()
    } else {
      this._scheduleNextRun(this.now())
    }
  }

  _unschedule () {
    this.timer.clearTimer(this._timer)
    this._timer = null
  }

  _scheduleNextRun (now) { // eslint-disable-line complexity
    if (this._tasks.length === 0) {
      return
    }

    var nextArrival = this._tasks[0].time

    if (this._timer === null) {
      this._scheduleNextArrival(nextArrival, now)
    } else if (nextArrival < this._nextArrival) {
      this._unschedule()
      this._scheduleNextArrival(nextArrival, now)
    }
  }

  _scheduleNextArrival (nextArrival, now) {
    this._nextArrival = nextArrival
    var delay = Math.max(0, nextArrival - now)
    this._timer = this.timer.setTimer(this._runReadyTasksBound, delay)
  }

  _runReadyTasks (now) {
    this._timer = null

    this._tasks = this._findAndRunTasks(now)

    this._scheduleNextRun(this.now())
  }

  _findAndRunTasks (now) {
    var tasks = this._tasks
    var l = tasks.length
    var i = 0

    while (i < l && tasks[i].time <= now) {
      ++i
    }

    this._tasks = tasks.slice(i)

    // Run all ready tasks
    for (var j = 0; j < i; ++j) {
      this._tasks = runTasks(tasks[j], this._tasks)
    }
    return this._tasks
  }
}

function removeAllFrom (f, timeslot) {
  timeslot.events = removeAll(f, timeslot.events)
}

function runTasks (timeslot, tasks) { // eslint-disable-line complexity
  var events = timeslot.events
  for (var i = 0; i < events.length; ++i) {
    var task = events[i]

    if (task.active) {
      runTask(task)

      // Reschedule periodic repeating tasks
      // Check active again, since a task may have canceled itself
      if (task.period >= 0) {
        task.time = task.time + task.period
        insertByTime(task, tasks)
      }
    }
  }

  return tasks
}

function runTask (task) {
  try {
    return task.run()
  } catch (e) {
    return task.error(e)
  }
}

function insertByTime (task, timeslots) { // eslint-disable-line complexity
  var l = timeslots.length

  if (l === 0) {
    timeslots.push(newTimeslot(task.time, [task]))
    return
  }

  var i = binarySearch(task.time, timeslots)

  if (i >= l) {
    timeslots.push(newTimeslot(task.time, [task]))
  } else if (task.time === timeslots[i].time) {
    timeslots[i].events.push(task)
  } else {
    timeslots.splice(i, 0, newTimeslot(task.time, [task]))
  }
}

function newTimeslot (t, events) {
  return { time: t, events: events }
}
