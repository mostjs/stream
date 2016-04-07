/** @license MIT License (c) copyright 2016 original author or authors */

export default class ScheduledTask {
  constructor (delay, period, task, scheduler) {
    this.time = delay
    this.period = period
    this.task = task
    this.scheduler = scheduler
    this.active = true
  }

  run () {
    return this.task.run(this.time)
  }

  error (e) {
    return this.task.error(this.time, e)
  }

  cancel () {
    this.scheduler.cancel(this)
    return this.task.dispose()
  }
}
